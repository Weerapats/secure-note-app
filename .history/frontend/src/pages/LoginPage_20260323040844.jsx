/**
 * LoginPage.jsx — Split-screen auth page
 * Runtime: Browser | Virtual DOM: React reconciler
 */
import { useState } from 'react'
import { API_BASE } from '../config'

const QUOTES = [
  { text: 'Your thoughts, kept safe.', attr: 'SecureNote' },
  { text: 'Write without worry.', attr: 'SecureNote' },
  { text: 'Private by design.', attr: 'SecureNote' },
]

export default function LoginPage({ onLogin }) {
  const [token, setToken]     = useState('')
  const [show, setShow]       = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const [quoteIdx]            = useState(() => Math.floor(Math.random() * QUOTES.length))
  const quote = QUOTES[quoteIdx]

  async function handleSubmit(e) {
    e.preventDefault()
    if (!token.trim()) return setError('Please enter your access token.')
    setError('')
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/verify`, {
        headers: { 'Authorization': token.trim() },
        signal: AbortSignal.timeout(5000),
      })
      if (res.status === 401) {
        setError('Incorrect token. Please check your SECRET_TOKEN.')
        return
      }
      if (!res.ok) throw new Error(`Server responded with ${res.status}`)
      onLogin(token.trim())
    } catch (err) {
      if (err.name === 'TimeoutError' || err.name === 'AbortError') {
        setError('Server is not responding. Is the backend running on port 3001?')
      } else if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError') || err.message.includes('net::')) {
        setError('Cannot reach the backend. Run: cd backend && npm start')
      } else {
        setError(`Connection error: ${err.message}`)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-root">

      {/* ── Left decorative panel (hidden on mobile via CSS) ── */}
      <div className="login-left">
        <div style={s.leftContent}>
          <div style={s.leftLogo}>
            <StarIcon />
            <span style={s.leftLogoText}>SecureNote</span>
          </div>
          <div style={s.dividerLines}>
            {[100, 80, 60, 40, 25].map((w, i) => (
              <div key={i} style={{ ...s.dividerLine, width: `${w}%`, opacity: 0.5 - i * 0.08 }} />
            ))}
          </div>
          <blockquote style={s.quote}>
            <p style={s.quoteText}>"{quote.text}"</p>
            <cite style={s.quoteAttr}>— {quote.attr}</cite>
          </blockquote>
          <div style={s.leftFooter}>
            {[0,1,2].map(i => (
              <span key={i} style={{ ...s.dot, animationDelay: `${i * 0.4}s` }} />
            ))}
          </div>
        </div>
        {/* Decorative circles */}
        <div style={{ ...s.circle, width: 320, height: 320, bottom: -100, right: -80 }} />
        <div style={{ ...s.circle, width: 160, height: 160, top: 60, right: 40 }} />
      </div>

      {/* ── Right form panel ── */}
      <div className="login-right">
        <div style={s.card}>

          {/* Logo shown only on mobile (left panel is hidden) */}
          <div style={s.mobileLogoWrap}>
            <StarIcon color="var(--brown)" />
            <span style={s.mobileLogoText}>SecureNote</span>
          </div>

          <div style={s.cardHeader}>
            <h1 style={s.cardTitle}>Welcome back</h1>
            <p style={s.cardSub}>Enter your access token to sign in</p>
          </div>

          <form onSubmit={handleSubmit} style={s.form}>
            <div style={s.fieldGroup}>
              <label style={s.label} htmlFor="tok">Access Token</label>
              <div style={s.inputRow}>
                <span style={s.inputPre}><LockIcon /></span>
                <input
                  id="tok"
                  type={show ? 'text' : 'password'}
                  value={token}
                  onChange={e => { setToken(e.target.value); setError('') }}
                  placeholder="Paste your token here…"
                  style={{ ...s.input, ...(error ? s.inputErr : {}) }}
                  autoComplete="off"
                  spellCheck={false}
                />
                <button type="button" onClick={() => setShow(p => !p)} style={s.eyeBtn} aria-label="Toggle visibility">
                  {show ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
              {error && (
                <div style={s.errMsg}>
                  <InfoIcon /> {error}
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || !token}
              style={{ ...s.submitBtn, opacity: (!token || loading) ? 0.55 : 1, cursor: (!token || loading) ? 'not-allowed' : 'pointer' }}
            >
              {loading
                ? <><Spinner /> <span>Verifying…</span></>
                : <><span>Sign in</span> <span style={s.arrow}>→</span></>
              }
            </button>
          </form>

          <p style={s.hintText}>
            Token = <code style={s.code}>SECRET_TOKEN</code> from <code style={s.code}>backend/.env</code>
          </p>
        </div>
      </div>
    </div>
  )
}

/* ── Icons ── */
const StarIcon = ({ color = 'var(--brown-light)' }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill={color} stroke="none">
    <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>
  </svg>
)
const LockIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
)
const EyeIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
  </svg>
)
const EyeOffIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
)
const InfoIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}>
    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
)
const Spinner = () => (
  <span style={{ width:14, height:14, border:'2px solid rgba(250,248,243,0.35)', borderTopColor:'var(--cream)', borderRadius:'50%', animation:'spin 0.6s linear infinite', display:'inline-block', flexShrink:0 }} />
)

/* ── Styles (non-responsive only — responsive via CSS classes) ── */
const s = {
  leftContent: { position:'relative', zIndex:1, display:'flex', flexDirection:'column', gap:'2.5rem', width:'100%' },
  leftLogo: { display:'flex', alignItems:'center', gap:'0.6rem' },
  leftLogoText: { fontFamily:'var(--font-serif)', fontSize:'1.3rem', fontWeight:500, color:'var(--cream)', letterSpacing:'0.03em' },
  dividerLines: { display:'flex', flexDirection:'column', gap:'8px' },
  dividerLine: { height:'1px', background:'var(--brown-light)', borderRadius:'1px' },
  quote: { display:'flex', flexDirection:'column', gap:'1rem', animation:'fadeUp 0.7s var(--ease) 0.1s both' },
  quoteText: { fontFamily:'var(--font-serif)', fontSize:'clamp(1.5rem,3vw,2.1rem)', fontWeight:400, fontStyle:'italic', color:'var(--cream)', lineHeight:1.35 },
  quoteAttr: { fontSize:'0.72rem', letterSpacing:'0.2em', textTransform:'uppercase', color:'var(--brown-light)', fontStyle:'normal' },
  leftFooter: { display:'flex', gap:'8px' },
  dot: { width:6, height:6, borderRadius:'50%', background:'var(--brown-light)', opacity:0.5, display:'block', animation:'pulse-dot 2s ease-in-out infinite' },
  circle: { position:'absolute', borderRadius:'50%', border:'1px solid rgba(196,168,130,0.15)', pointerEvents:'none' },

  /* Mobile logo — only visible when left panel is hidden */
  mobileLogoWrap: { display:'flex', alignItems:'center', gap:'0.5rem', marginBottom:'0.5rem' },
  mobileLogoText: { fontFamily:'var(--font-serif)', fontSize:'1.2rem', fontWeight:500, color:'var(--charcoal)' },

  card: { width:'100%', maxWidth:'380px', display:'flex', flexDirection:'column', gap:'2rem', animation:'fadeUp 0.5s var(--ease) both' },
  cardHeader: { display:'flex', flexDirection:'column', gap:'0.35rem' },
  cardTitle: { fontFamily:'var(--font-serif)', fontSize:'clamp(1.6rem,5vw,2.1rem)', fontWeight:500, color:'var(--charcoal)', lineHeight:1.15 },
  cardSub: { fontSize:'0.9rem', color:'var(--charcoal-3)', fontWeight:300 },
  form: { display:'flex', flexDirection:'column', gap:'1.25rem' },
  fieldGroup: { display:'flex', flexDirection:'column', gap:'0.5rem' },
  label: { fontSize:'0.72rem', fontWeight:500, letterSpacing:'0.1em', textTransform:'uppercase', color:'var(--charcoal-2)' },
  inputRow: { position:'relative', display:'flex', alignItems:'center' },
  inputPre: { position:'absolute', left:'0.85rem', color:'var(--charcoal-4)', display:'flex', pointerEvents:'none' },
  input: { width:'100%', padding:'0.8rem 2.8rem 0.8rem 2.6rem', background:'var(--white)', border:'1.5px solid var(--cream-3)', borderRadius:'var(--radius-sm)', fontSize:'0.875rem', fontFamily:'var(--font-sans)', color:'var(--charcoal)', outline:'none', transition:'border-color 0.2s, box-shadow 0.2s', letterSpacing:'0.04em' },
  inputErr: { borderColor:'var(--red)', boxShadow:'0 0 0 3px rgba(176,64,64,0.1)' },
  eyeBtn: { position:'absolute', right:'0.85rem', background:'none', border:'none', cursor:'pointer', color:'var(--charcoal-4)', display:'flex', padding:'0.2rem', borderRadius:'4px' },
  errMsg: { display:'flex', alignItems:'center', gap:'0.4rem', fontSize:'0.78rem', color:'var(--red)', animation:'slideDown 0.2s ease' },
  submitBtn: { display:'flex', alignItems:'center', justifyContent:'center', gap:'0.5rem', background:'var(--charcoal)', color:'var(--cream)', border:'none', borderRadius:'var(--radius-sm)', padding:'0.875rem 1.5rem', fontSize:'0.9rem', fontWeight:500, fontFamily:'var(--font-sans)', transition:'background 0.2s, box-shadow 0.2s', boxShadow:'var(--shadow-sm)', width:'100%' },
  arrow: { fontSize:'1.1rem' },
  hintText: { fontSize:'0.75rem', color:'var(--charcoal-4)', lineHeight:1.6 },
  code: { fontFamily:'monospace', background:'var(--cream-2)', padding:'0.1em 0.4em', borderRadius:'3px', fontSize:'0.85em', color:'var(--brown-dark)' },
}