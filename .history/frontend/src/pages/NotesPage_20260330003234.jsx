/**
 * NotesPage.jsx — Main notes dashboard
 * Uses className for responsive layout, inline styles for non-responsive properties.
 */
import { useState, useEffect } from 'react'
import { API_BASE } from '../config'
import NoteCard from '../components/NoteCard'
import ComposePanel from '../components/ComposePanel'

export default function NotesPage({ token, onLogout }) {
  const [notes, setNotes]           = useState([])
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState('')
  const [showCompose, setShowCompose] = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const [search, setSearch]         = useState('')
  const [searching, setSearching]   = useState(false)

  useEffect(() => { loadNotes() }, [])

  // Debounced search — fires 400ms after user stops typing
  useEffect(() => {
    const timer = setTimeout(() => {
      loadNotes(search)
    }, 400)
    return () => clearTimeout(timer) // cleanup on each keystroke
  }, [search])

  async function loadNotes(query = '') {
    query ? setSearching(true) : setLoading(true)
    setError('')
    try {
      const url = query ? `${API_BASE}/notes?search=${encodeURIComponent(query)}` : `${API_BASE}/notes`
      const res = await fetch(url)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      setNotes(await res.json())
    } catch (err) {
      setError('Failed to load notes. ' + err.message)
    } finally {
      setLoading(false)
      setSearching(false)
    }
  }

  function handleClearSearch() {
    setSearch('')
  }

  async function handleCreate(title, content) {
    const res = await fetch(`${API_BASE}/notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': token },
      body: JSON.stringify({ title, content }),
    })
    if (res.status === 401) throw new Error('Invalid token — check your SECRET_TOKEN.')
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const newNote = await res.json()
    setNotes(prev => [newNote, ...prev])
    setShowCompose(false)
  }

  async function handleEdit(id, title, content) {
    const res = await fetch(`${API_BASE}/notes/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'Authorization': token },
      body: JSON.stringify({ title, content }),
    })
    if (res.status === 401) throw new Error('Invalid token.')
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const updated = await res.json()
    setNotes(prev => prev.map(n => n.id === id ? updated : n))
  }

  async function handleDelete(id) {
    setDeletingId(id)
    try {
      const res = await fetch(`${API_BASE}/notes/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': token },
      })
      if (res.status === 401) { setError('Delete failed: invalid token.'); return }
      if (!res.ok && res.status !== 404) { setError('Delete failed.'); return }
      setNotes(prev => prev.filter(n => n.id !== id))
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div style={{ minHeight:'100vh', background:'var(--cream)', fontFamily:'var(--font-sans)' }}>

      {/* ── Nav ── */}
      <header className="nav-root">
        <div className="nav-inner">
          <div style={s.brand}>
            <span style={s.star}>✦</span>
            <span style={s.brandName}>SecureNote</span>
          </div>
          <div className="nav-right">
            <span className="nav-label">
              {notes.length} {notes.length === 1 ? 'note' : 'notes'}
            </span>
            <button onClick={loadNotes} style={s.iconBtn} title="Refresh" aria-label="Refresh">
              <RefreshIcon />
            </button>
            <button onClick={onLogout} style={{ ...s.iconBtn, ...s.logoutBtn }}>
              <LogoutIcon />
              <span className="nav-logout-label">Sign out</span>
            </button>
          </div>
        </div>
      </header>

      {/* ── Main ── */}
      <main className="notes-main">

        {error && (
          <div style={s.errorBanner}>
            <InfoIcon />
            <span style={{ flex:1 }}>{error}</span>
            <button onClick={() => setError('')} style={s.dismissBtn}>✕</button>
          </div>
        )}

        {/* ── Search bar ── */}
        <div style={ss.form}>
          <div style={ss.inputWrap}>
            <span style={ss.searchIcon}><SearchIcon /></span>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search notes by title or content…"
              style={ss.input}
              autoComplete="off"
            />
            {search && (
              <button type="button" onClick={handleClearSearch} style={ss.clearBtn} aria-label="Clear search">✕</button>
            )}
          </div>
          {searching && (
            <div style={ss.searchingIndicator}>
              <Spinner /> <span style={{fontSize:'0.8rem',color:'var(--charcoal-4)'}}>Searching…</span>
            </div>
          )}
        </div>

        {showCompose && (
          <div style={{ marginBottom:'1.5rem', animation:'slideDown 0.25s var(--ease)' }}>
            <ComposePanel onSave={handleCreate} onCancel={() => setShowCompose(false)} />
          </div>
        )}

        <div className="section-header">
          <div>
            <h2 style={s.sectionTitle}>Your Notes</h2>
            <p style={s.sectionSub}>All your private notes, persisted securely.</p>
          </div>
          {!showCompose && (
            <button onClick={() => setShowCompose(true)} style={s.addBtn}>
              <PlusIcon /> <span>New Note</span>
            </button>
          )}
        </div>

        {loading ? (
          <div className="notes-grid">
            {[1,2,3,4,5,6].map(i => <SkeletonCard key={i} />)}
          </div>
        ) : notes.length === 0 ? (
          <EmptyState onNew={() => setShowCompose(true)} />
        ) : (
          <div className="notes-grid">
            {notes.map((note, idx) => (
              <NoteCard
                key={note.id}
                note={note}
                onDelete={handleDelete}
                onEdit={handleEdit}
                deleting={deletingId === note.id}
                animDelay={idx * 50}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

function EmptyState({ onNew }) {
  return (
    <div style={es.wrap}>
      <div style={es.icon}>📝</div>
      <h3 style={es.title}>No notes yet</h3>
      <p style={es.text}>Create your first note and it will appear here.</p>
      <button onClick={onNew} style={es.btn}><PlusIcon /> <span>Create first note</span></button>
    </div>
  )
}

function SkeletonCard() {
  return (
    <div style={sk.card}>
      <div style={{ ...sk.line, width:'60%', height:18, marginBottom:12 }} />
      <div style={{ ...sk.line, width:'100%', height:12, marginBottom:6 }} />
      <div style={{ ...sk.line, width:'80%', height:12, marginBottom:6 }} />
      <div style={{ ...sk.line, width:'40%', height:10, marginTop:16 }} />
    </div>
  )
}

const SearchIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
)
const Spinner = () => (
  <span style={{width:13,height:13,border:'2px solid rgba(28,25,23,0.2)',borderTopColor:'var(--charcoal)',borderRadius:'50%',animation:'spin 0.6s linear infinite',display:'inline-block'}} />
)
const RefreshIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
  </svg>
)
const LogoutIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
)
const PlusIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
)
const InfoIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink:0 }}>
    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
)

const s = {
  brand: { display:'flex', alignItems:'center', gap:'0.5rem' },
  star:  { color:'var(--brown)', fontSize:'1rem' },
  brandName: { fontFamily:'var(--font-serif)', fontSize:'1.2rem', fontWeight:500, color:'var(--charcoal)', letterSpacing:'0.02em' },
  iconBtn: { display:'flex', alignItems:'center', gap:'0.4rem', background:'none', border:'1px solid var(--cream-3)', borderRadius:'var(--radius-sm)', padding:'0.4rem 0.7rem', fontSize:'0.8rem', fontFamily:'var(--font-sans)', color:'var(--charcoal-2)', cursor:'pointer', whiteSpace:'nowrap' },
  logoutBtn: { color:'var(--charcoal-3)' },
  errorBanner: { display:'flex', alignItems:'center', gap:'0.6rem', background:'#FBF0F0', border:'1px solid rgba(176,64,64,0.25)', borderRadius:'var(--radius-sm)', padding:'0.75rem 1rem', marginBottom:'1.5rem', fontSize:'0.85rem', color:'var(--red)', animation:'slideDown 0.2s ease' },
  dismissBtn: { background:'none', border:'none', cursor:'pointer', color:'var(--red)', opacity:0.7, padding:'0 0.2rem', fontSize:'0.9rem' },
  sectionTitle: { fontFamily:'var(--font-serif)', fontSize:'clamp(1.3rem,4vw,1.6rem)', fontWeight:500, color:'var(--charcoal)', lineHeight:1.2 },
  sectionSub: { fontSize:'0.82rem', color:'var(--charcoal-4)', marginTop:'0.25rem' },
  addBtn: { display:'flex', alignItems:'center', gap:'0.4rem', background:'var(--charcoal)', color:'var(--cream)', border:'none', borderRadius:'var(--radius-sm)', padding:'0.65rem 1.1rem', fontSize:'0.85rem', fontWeight:500, fontFamily:'var(--font-sans)', cursor:'pointer', boxShadow:'var(--shadow-sm)', flexShrink:0, whiteSpace:'nowrap' },
}

const ss = {
  form: { display:'flex', gap:'0.6rem', marginBottom:'1.5rem', flexWrap:'wrap' },
  inputWrap: { position:'relative', display:'flex', alignItems:'center', flex:1, minWidth:200 },
  searchIcon: { position:'absolute', left:'0.75rem', color:'var(--charcoal-4)', display:'flex', pointerEvents:'none' },
  input: { width:'100%', padding:'0.65rem 2.2rem 0.65rem 2.4rem', background:'var(--white)', border:'1.5px solid var(--cream-3)', borderRadius:'var(--radius-sm)', fontSize:'0.875rem', fontFamily:'var(--font-sans)', color:'var(--charcoal)', outline:'none', transition:'border-color 0.2s' },
  clearBtn: { position:'absolute', right:'0.7rem', background:'none', border:'none', cursor:'pointer', color:'var(--charcoal-4)', fontSize:'0.85rem', padding:'0.1rem 0.3rem', borderRadius:'3px' },
  searchingIndicator: { display:'flex', alignItems:'center', gap:'0.5rem', padding:'0 0.25rem' },
  searchBtn: { background:'var(--charcoal)', color:'var(--cream)', border:'none', borderRadius:'var(--radius-sm)', padding:'0.65rem 1.1rem', fontSize:'0.85rem', fontWeight:500, fontFamily:'var(--font-sans)', cursor:'pointer', display:'flex', alignItems:'center', gap:'0.4rem', whiteSpace:'nowrap' },
}

const es = {
  wrap: { display:'flex', flexDirection:'column', alignItems:'center', gap:'1rem', padding:'4rem 1rem', textAlign:'center' },
  icon: { fontSize:'2.5rem' },
  title: { fontFamily:'var(--font-serif)', fontSize:'1.4rem', fontWeight:500, color:'var(--charcoal)' },
  text: { fontSize:'0.875rem', color:'var(--charcoal-4)', maxWidth:280 },
  btn: { display:'flex', alignItems:'center', gap:'0.4rem', marginTop:'0.5rem', background:'var(--charcoal)', color:'var(--cream)', border:'none', borderRadius:'var(--radius-sm)', padding:'0.7rem 1.25rem', fontSize:'0.875rem', fontWeight:500, fontFamily:'var(--font-sans)', cursor:'pointer' },
}

const sk = {
  card: { background:'var(--white)', border:'1px solid var(--cream-3)', borderRadius:'var(--radius-md)', padding:'1.25rem' },
  line: { background:`linear-gradient(90deg,var(--cream-2) 25%,var(--cream-3) 50%,var(--cream-2) 75%)`, backgroundSize:'200% 100%', animation:'shimmer 1.5s ease infinite', borderRadius:4 },
}