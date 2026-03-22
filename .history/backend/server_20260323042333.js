/**
 * SecureNote — Backend API Server
 * Runtime: Node.js | Framework: Express.js
 *

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
  methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
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
    const response = await fetch(
      `${POCKETHOST_BASE}?sort=-created&perPage=100`,
      { headers: phHeaders }
    );
    const data = await response.json();

    // PocketBase returns { items: [...] } or { items: null } on empty
    const notes = data.items ?? [];
    return res.status(200).json(notes);
  } catch (err) {
    console.error('GET /api/notes error:', err.message);
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