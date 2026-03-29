/**
 * SecureNote — Backend API Server
 * Runtime: Node.js | Framework: Express.js
 *
 * Architecture:
 *  - This file runs in the NODE.JS RUNTIME (not the browser).
 *  - JavaScript is executed by the V8 engine, but Node provides extra APIs
 *    (file system, HTTP, process.env, etc.) that do NOT exist in the browser.
 *  - Sensitive config (SECRET_TOKEN, POCKETHOST_TOKEN) lives HERE, never on
 *    the client, because server code is never served to the browser.
 */

const express = require('express');
const dotenv  = require('dotenv');
const cors    = require('cors');

// Load environment variables from .env BEFORE accessing process.env
dotenv.config();

const app = express();

// ─── Config from environment variables ─────────────────────────────────────
const PORT             = process.env.PORT || 3001;
const SECRET_TOKEN     = process.env.SECRET_TOKEN;
const POCKETHOST_TOKEN = process.env.POCKETHOST_TOKEN;
const POCKETHOST_BASE  =
  'https://app-tracking.pockethost.io/api/collections/notes/records';

if (!SECRET_TOKEN) {
  console.error('FATAL: SECRET_TOKEN is not set in .env');
  process.exit(1);
}

// ─── Middleware ─────────────────────────────────────────────────────────────
// Allow cross-origin requests from the frontend (localhost:5173 in dev, or any origin)
app.use(cors({
  origin: true,             // Reflect the request origin (allows any origin in dev)
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());    // Parse incoming JSON request bodies

// ─── Auth Middleware ────────────────────────────────────────────────────────
/**
 * requireAuth — checks that the caller supplies the correct SECRET_TOKEN in
 * the Authorization header. Mutating/deleting operations require this.
 */
const requireAuth = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader || authHeader !== SECRET_TOKEN) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'A valid Authorization token is required for this action.',
    });
  }
  next();
};

// ─── Helper: PocketHost fetch wrapper ──────────────────────────────────────
const phHeaders = {
  'Content-Type':  'application/json',
  'Authorization': `Bearer ${POCKETHOST_TOKEN}`,
};

// ─── Routes ─────────────────────────────────────────────────────────────────

/**
 * GET /api/verify
 * Validates the Authorization token. Returns 200 if correct, 401 if not.
 */
app.get("/api/verify", requireAuth, (req, res) => {
  return res.status(200).json({ ok: true });
});


/**
 * GET /api/notes
 * Returns all notes from PocketHost as JSON.
 * Public endpoint — no auth needed to read notes.
 */
app.get('/api/notes', async (req, res) => {
  try {
    // Support optional ?search=keyword query param (maps to PocketBase filter)
    const { search } = req.query;
    let url = `${POCKETHOST_BASE}?sort=-created&perPage=100`;

    if (search && search.trim()) {
      // PocketBase filter syntax: search title and content fields
      const filter = encodeURIComponent(`title ~ "${search.trim()}" || content ~ "${search.trim()}"`);
      url += `&filter=${filter}`;
    }

    const response = await fetch(url, { headers: phHeaders });
    const data = await response.json();

    const notes = data.items ?? [];
    return res.status(200).json(notes);
  } catch (err) {
    console.error('GET /api/notes error:', err.message);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

/**
 * GET /api/notes/:id
 * Returns a single note by ID. Public endpoint.
 */
app.get('/api/notes/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const response = await fetch(`${POCKETHOST_BASE}/${id}`, { headers: phHeaders });
    if (response.status === 404) {
      return res.status(404).json({ error: 'Not Found', message: `Note "${id}" does not exist.` });
    }
    const note = await response.json();
    return res.status(200).json(note);
  } catch (err) {
    console.error(`GET /api/notes/${id} error:`, err.message);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

/**
 * POST /api/notes
 * Creates a new note. Requires Authorization header.
 * Body: { title: string, content: string }
 * Returns: 201 Created with the new note object.
 */
app.post('/api/notes', requireAuth, async (req, res) => {
  const { title, content } = req.body;

  if (!title || !content) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Both "title" and "content" fields are required.',
    });
  }

  try {
    const response = await fetch(POCKETHOST_BASE, {
      method:  'POST',
      headers: phHeaders,
      body:    JSON.stringify({ title, content }),
    });

    if (!response.ok) {
      const err = await response.json();
      console.error('PocketHost POST error:', err);
      return res.status(502).json({ error: 'Failed to create note in database' });
    }

    const newNote = await response.json();
    return res.status(201).json(newNote);
  } catch (err) {
    console.error('POST /api/notes error:', err.message);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

/**
 * DELETE /api/notes/:id
 * Deletes a note by ID. Requires Authorization header.
 * Returns: 200 OK on success, 404 if not found.
 */

/**
 * PATCH /api/notes/:id
 * Updates an existing note. Requires Authorization header.
 * Body: { title?: string, content?: string }
 * Returns: 200 OK with updated note object.
 */
app.patch('/api/notes/:id', requireAuth, async (req, res) => {
  const { id } = req.params;
  const { title, content } = req.body;

  if (!title && !content) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'At least one of "title" or "content" is required.',
    });
  }

  try {
    const response = await fetch(`${POCKETHOST_BASE}/${id}`, {
      method:  'PATCH',
      headers: phHeaders,
      body:    JSON.stringify({ ...(title && { title }), ...(content && { content }) }),
    });

    if (response.status === 404) {
      return res.status(404).json({ error: 'Not Found', message: `Note "${id}" does not exist.` });
    }

    if (!response.ok) {
      return res.status(502).json({ error: 'Failed to update note in database' });
    }

    const updatedNote = await response.json();
    return res.status(200).json(updatedNote);
  } catch (err) {
    console.error(`PATCH /api/notes/${id} error:`, err.message);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.delete('/api/notes/:id', requireAuth, async (req, res) => {
  const { id } = req.params;

  try {
    const response = await fetch(`${POCKETHOST_BASE}/${id}`, {
      method:  'DELETE',
      headers: phHeaders,
    });

    if (response.status === 404) {
      return res.status(404).json({
        error: 'Not Found',
        message: `Note with id "${id}" does not exist.`,
      });
    }

    if (!response.ok) {
      return res.status(502).json({ error: 'Failed to delete note from database' });
    }

    return res.status(200).json({ message: `Note "${id}" deleted successfully.` });
  } catch (err) {
    console.error(`DELETE /api/notes/${id} error:`, err.message);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

// ─── 404 catch-all ──────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found', path: req.originalUrl });
});

// ─── Start server (local dev) or export for Vercel serverless ───────────────
// When running locally: node server.js → starts a real HTTP server
// When running on Vercel: module.exports = app → Vercel wraps it as a serverless function
if (process.env.VERCEL) {
  // Vercel serverless — just export the app, no listen() needed
  module.exports = app;
} else {
  app.listen(PORT, () => {
    console.log(`\n🔐 SecureNote API running → http://localhost:${PORT}`);
    console.log(`   GET    http://localhost:${PORT}/api/notes`);
    console.log(`   POST   http://localhost:${PORT}/api/notes  (Auth required)`);
    console.log(`   DELETE http://localhost:${PORT}/api/notes/:id  (Auth required)\n`);
  });
}