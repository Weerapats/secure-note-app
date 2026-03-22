import { useState } from 'react'
import LoginPage from './pages/LoginPage'
import NotesPage from './pages/NotesPage'

export default function App() {
  // token stored in sessionStorage — survives refresh, cleared when tab closes
  const [token, setToken] = useState(() => sessionStorage.getItem('sn_token'))

  function handleLogin(t) {
    sessionStorage.setItem('sn_token', t)
    setToken(t)
  }

  function handleLogout() {
    sessionStorage.removeItem('sn_token')
    setToken(null)
  }

  if (!token) return <LoginPage onLogin={handleLogin} />
  return <NotesPage token={token} onLogout={handleLogout} />
}