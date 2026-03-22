/**
 * App.jsx — Root component
 * Runtime: Browser | Engine: V8 (Chrome) or SpiderMonkey (Firefox)
 *
 * Manages global auth state. The token entered on LoginPage is stored
 * in React state only — never in localStorage, never in a source file.
 * React's Virtual DOM diffs the component tree and applies minimal
 * real-DOM updates when state changes.
 */
import { useState } from 'react'
import LoginPage from './pages/LoginPage'
import NotesPage from './pages/NotesPage'

export default function App() {
  // token lives in React state — cleared when tab closes (no persistence)
  const [token, setToken] = useState(null)

  if (!token) {
    return <LoginPage onLogin={setToken} />
  }

  return <NotesPage token={token} onLogout={() => setToken(null)} />
}
