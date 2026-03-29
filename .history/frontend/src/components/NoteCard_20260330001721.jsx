/**
 * NoteCard.jsx — Individual note card with inline edit support
 * Demonstrates conditional rendering and controlled inputs in React.
 */
import { useState } from 'react'

export default function NoteCard({ note, onDelete, onEdit, deleting, animDelay = 0 }) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [editing, setEditing]             = useState(false)
  const [editTitle, setEditTitle]         = useState(note.title)
  const [editContent, setEditContent]     = useState(note.content)
  const [saving, setSaving]               = useState(false)
  const [editError, setEditError]         = useState('')

  function formatDate(iso) {
    if (!iso) return ''
    return new Date(iso).toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' })
  }

  async function handleSaveEdit() {
    if (!editTitle.trim()) return setEditError('Title is required.')
    if (!editContent.trim()) return setEditError('Content is required.')
    setSaving(true)
    setEditError('')
    try {
      await onEdit(note.id, editTitle.trim(), editContent.trim())
      setEditing(false)
    } catch (err) {
      setEditError(err.message || 'Failed to save.')
    } finally {
      setSaving(false)
    }
  }

  function handleCancelEdit() {
    setEditTitle(note.title)
    setEditContent(note.content)
    setEditError('')
    setEditing(false)
  }

  const initial = (note.title || '?')[0].toUpperCase()

  /* ── Edit mode ── */
  if (editing) {
    return (
      <article style={{ ...s.card, animationDelay:`${animDelay}ms`, outline:'2px solid var(--brown-light)' }}>
        <div style={s.editHeader}>
          <span style={s.editBadge}>Editing</span>
          <button onClick={handleCancelEdit} style={s.cancelEditBtn}>✕ Cancel</button>
        </div>
        <input
          value={editTitle}
          onChange={e => { setEditTitle(e.target.value); setEditError('') }}
          style={s.editTitleInput}
          placeholder="Title…"
          maxLength={120}
          autoFocus
        />
        <textarea
          value={editContent}
          onChange={e => { setEditContent(e.target.value); setEditError('') }}
          style={s.editContentInput}
          placeholder="Content…"
          rows={4}
        />
        {editError && <p style={s.editError}>⚠ {editError}</p>}
        <button
          onClick={handleSaveEdit}
          disabled={saving}
          style={{ ...s.saveEditBtn, opacity: saving ? 0.6 : 1 }}
        >
          {saving ? 'Saving…' : '✓ Save Changes'}
        </button>
      </article>
    )
  }

  /* ── View mode ── */
  return (
    <article style={{ ...s.card, opacity:deleting?0.4:1, transform:deleting?'scale(0.97)':'scale(1)', animationDelay:`${animDelay}ms` }}>
      <div style={s.top}>
        <div style={s.avatar}>{initial}</div>
        <div style={s.actions}>
          {confirmDelete ? (
            <div className="confirm-wrap">
              <span style={s.confirmText}>Delete?</span>
              <button onClick={() => onDelete(note.id)} disabled={deleting} style={{ ...s.actionBtn, ...s.confirmYes }}>
                {deleting ? '…' : 'Yes'}
              </button>
              <button onClick={() => setConfirmDelete(false)} style={{ ...s.actionBtn, ...s.confirmNo }}>No</button>
            </div>
          ) : (
            <>
              <button onClick={() => setEditing(true)} style={s.editBtn} aria-label="Edit note" title="Edit">
                <EditIcon />
              </button>
              <button onClick={() => setConfirmDelete(true)} style={s.deleteBtn} aria-label="Delete note" title="Delete">
                <TrashIcon />
              </button>
            </>
          )}
        </div>
      </div>

      <div style={s.body}>
        <h3 style={s.title}>{note.title}</h3>
        <p style={s.content}>{note.content}</p>
      </div>

      <div style={s.footer}>
        <span style={s.date}>{formatDate(note.created)}</span>
        <span style={s.badge}>note</span>
      </div>
    </article>
  )
}

const EditIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
)
const TrashIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <polyline points="3 6 5 6 21 6"/>
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
    <path d="M10 11v6M14 11v6M9 6V4h6v2"/>
  </svg>
)

const s = {
  card: { background:'var(--white)', border:'1px solid var(--cream-3)', borderRadius:'var(--radius-md)', padding:'1.25rem', display:'flex', flexDirection:'column', gap:'0.75rem', transition:'transform 0.2s, box-shadow 0.2s, opacity 0.2s', boxShadow:'var(--shadow-sm)', animation:'fadeUp 0.4s var(--ease) both' },
  top: { display:'flex', alignItems:'center', justifyContent:'space-between' },
  avatar: { width:34, height:34, borderRadius:'var(--radius-sm)', background:'var(--brown-faint)', color:'var(--brown-dark)', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'var(--font-serif)', fontSize:'1rem', fontWeight:600, flexShrink:0 },
  actions: { display:'flex', alignItems:'center', gap:'0.35rem' },
  editBtn: { background:'none', border:'1px solid transparent', borderRadius:'var(--radius-sm)', color:'var(--charcoal-4)', cursor:'pointer', padding:'0.3rem 0.4rem', display:'flex', transition:'all 0.15s' },
  deleteBtn: { background:'none', border:'1px solid transparent', borderRadius:'var(--radius-sm)', color:'var(--charcoal-4)', cursor:'pointer', padding:'0.3rem 0.4rem', display:'flex', transition:'all 0.15s' },
  confirmText: { fontSize:'0.75rem', color:'var(--charcoal-3)', whiteSpace:'nowrap' },
  actionBtn: { border:'none', borderRadius:'4px', padding:'0.2rem 0.55rem', fontSize:'0.73rem', fontWeight:500, fontFamily:'var(--font-sans)', cursor:'pointer' },
  confirmYes: { background:'var(--red)', color:'#fff' },
  confirmNo:  { background:'var(--cream-2)', color:'var(--charcoal-2)' },
  body: { display:'flex', flexDirection:'column', gap:'0.5rem', flex:1 },
  title: { fontFamily:'var(--font-serif)', fontSize:'1.1rem', fontWeight:500, color:'var(--charcoal)', lineHeight:1.3, display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' },
  content: { fontSize:'0.82rem', color:'var(--charcoal-3)', lineHeight:1.65, display:'-webkit-box', WebkitLineClamp:3, WebkitBoxOrient:'vertical', overflow:'hidden', whiteSpace:'pre-wrap' },
  footer: { display:'flex', alignItems:'center', justifyContent:'space-between', paddingTop:'0.5rem', borderTop:'1px solid var(--cream-2)', marginTop:'auto' },
  date: { fontSize:'0.72rem', color:'var(--charcoal-4)' },
  badge: { fontSize:'0.65rem', fontWeight:500, letterSpacing:'0.12em', textTransform:'uppercase', color:'var(--brown)', background:'var(--brown-faint)', padding:'0.15rem 0.5rem', borderRadius:'20px' },

  /* Edit mode */
  editHeader: { display:'flex', alignItems:'center', justifyContent:'space-between' },
  editBadge: { fontSize:'0.68rem', fontWeight:600, letterSpacing:'0.12em', textTransform:'uppercase', color:'var(--brown-dark)', background:'var(--brown-faint)', padding:'0.2rem 0.55rem', borderRadius:'20px' },
  cancelEditBtn: { background:'none', border:'none', cursor:'pointer', fontSize:'0.78rem', color:'var(--charcoal-4)', fontFamily:'var(--font-sans)' },
  editTitleInput: { width:'100%', padding:'0.55rem 0.7rem', background:'var(--cream)', border:'1.5px solid var(--brown-light)', borderRadius:'var(--radius-sm)', fontSize:'0.95rem', fontFamily:'var(--font-serif)', fontWeight:500, color:'var(--charcoal)', outline:'none', boxSizing:'border-box' },
  editContentInput: { width:'100%', padding:'0.55rem 0.7rem', background:'var(--cream)', border:'1.5px solid var(--brown-light)', borderRadius:'var(--radius-sm)', fontSize:'0.82rem', fontFamily:'var(--font-sans)', color:'var(--charcoal)', outline:'none', resize:'vertical', lineHeight:1.65, boxSizing:'border-box' },
  editError: { fontSize:'0.78rem', color:'var(--red)', margin:0 },
  saveEditBtn: { alignSelf:'flex-end', background:'var(--charcoal)', color:'var(--cream)', border:'none', borderRadius:'var(--radius-sm)', padding:'0.5rem 1rem', fontSize:'0.8rem', fontWeight:500, fontFamily:'var(--font-sans)', cursor:'pointer', transition:'opacity 0.2s' },
}