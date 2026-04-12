import { useEffect, useMemo, useState } from 'react'
import { Outlet } from 'react-router-dom'
import './index.css'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import AuthModal from './components/AuthModal'
import { fetchCurrentUser, fetchHistory, loginUser, signupUser } from './api'

export default function App() {
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [authModalMode, setAuthModalMode] = useState('login')
  const [authLoading, setAuthLoading] = useState(false)
  const [sessionLoading, setSessionLoading] = useState(true)
  const [authError, setAuthError] = useState('')
  const [user, setUser] = useState(null)
  const [history, setHistory] = useState([])

  function clearAuthStorage() {
    localStorage.removeItem('resume_auth_user')
    localStorage.removeItem('resume_auth_token')
  }

  useEffect(() => {
    async function restoreSession() {
      try {
        const token = localStorage.getItem('resume_auth_token')
        if (!token) {
          setSessionLoading(false)
          return
        }

        const result = await fetchCurrentUser()
        setUser(result.user)
        localStorage.setItem('resume_auth_user', JSON.stringify(result.user))
      } catch {
        clearAuthStorage()
        setUser(null)
      } finally {
        setSessionLoading(false)
      }
    }

    restoreSession()
  }, [])

  useEffect(() => {
    if (sessionLoading || !user) {
      setHistory([])
      return
    }

    fetchHistory()
      .then((data) => setHistory(data?.items || []))
      .catch((error) => {
        if (error?.status === 401) {
          clearAuthStorage()
          setUser(null)
        }
        setHistory([])
      })
  }, [user, sessionLoading])

  function persistAuth(nextUser, token) {
    setUser(nextUser)
    localStorage.setItem('resume_auth_user', JSON.stringify(nextUser))
    localStorage.setItem('resume_auth_token', token)
  }

  async function handleLogin({ email, password }) {
    setAuthLoading(true)
    setAuthError('')
    try {
      const result = await loginUser({ email, password })
      persistAuth(result.user, result.token)
      setAuthModalOpen(false)
    } catch (error) {
      setAuthError(error.message || 'Unable to sign in')
    } finally {
      setAuthLoading(false)
    }
  }

  async function handleSignup({ name, email, password }) {
    setAuthLoading(true)
    setAuthError('')
    try {
      const result = await signupUser({ name, email, password })
      persistAuth(result.user, result.token)
      setAuthModalOpen(false)
    } catch (error) {
      setAuthError(error.message || 'Unable to create account')
    } finally {
      setAuthLoading(false)
    }
  }

  function handleLogout() {
    setUser(null)
    setHistory([])
    clearAuthStorage()
  }

  const outletContext = useMemo(() => ({
    user,
    history,
    refreshHistory: async () => {
      if (!user) return
      try {
        const data = await fetchHistory()
        setHistory(data?.items || [])
      } catch (error) {
        if (error?.status === 401) {
          clearAuthStorage()
          setUser(null)
        }
        setHistory([])
        throw error
      }
    },
    openAuthModal: (mode = 'login') => {
      setAuthError('')
      setAuthModalMode(mode)
      setAuthModalOpen(true)
    },
    sessionLoading,
  }), [user, history, sessionLoading])

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar
        user={user}
        sessionLoading={sessionLoading}
        onOpenAuth={() => {
          setAuthError('')
          setAuthModalMode('login')
          setAuthModalOpen(true)
        }}
        onLogout={handleLogout}
      />
      <Outlet context={outletContext} />
      <Footer />
      <AuthModal
        open={authModalOpen}
        mode={authModalMode}
        onClose={() => setAuthModalOpen(false)}
        onLogin={handleLogin}
        onSignup={handleSignup}
        loading={authLoading}
        error={authError}
      />
    </div>
  )
}
