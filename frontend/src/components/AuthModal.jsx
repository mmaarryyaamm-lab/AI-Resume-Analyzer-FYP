import { useEffect, useState } from 'react'

const initialForm = {
  name: '',
  email: '',
  password: '',
}

export default function AuthModal({ open, mode = 'login', onClose, onLogin, onSignup, loading, error }) {
  const [currentMode, setCurrentMode] = useState(mode)
  const [form, setForm] = useState(initialForm)
  const [localError, setLocalError] = useState('')

  useEffect(() => {
    if (open) {
      setCurrentMode(mode)
      setForm(initialForm)
      setLocalError('')
    }
  }, [open, mode])

  if (!open) return null

  function updateField(key, value) {
    setLocalError('')
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const trimmedName = form.name.trim()
    const trimmedEmail = form.email.trim()

    if (!trimmedEmail || !form.password) {
      setLocalError('Email and password are required.')
      return
    }

    if (currentMode === 'signup' && !trimmedName) {
      setLocalError('Please add your name to create an account.')
      return
    }

    if (currentMode === 'signup') {
      await onSignup({ ...form, name: trimmedName, email: trimmedEmail })
    } else {
      await onLogin({ ...form, email: trimmedEmail })
    }
  }

  return (
    <div className="backdrop" role="dialog" aria-modal="true">
      <div className="modal auth-modal">
        <div className="modal-header">
          <div>
            <p className="eyebrow">Account</p>
            <h3 className="modal-title">{currentMode === 'signup' ? 'Create your workspace account' : 'Sign in to save history'}</h3>
          </div>
          <button type="button" className="icon-button" onClick={onClose} aria-label="Close authentication dialog">
            x
          </button>
        </div>
        <form className="modal-body auth-form" onSubmit={handleSubmit}>
          {currentMode === 'signup' ? (
            <label className="field">
              <span>Full name</span>
              <input value={form.name} onChange={(e) => updateField('name', e.target.value)} placeholder="Aftab Ahmad" />
            </label>
          ) : null}

          <label className="field">
            <span>Email</span>
            <input
              type="email"
              value={form.email}
              onChange={(e) => updateField('email', e.target.value)}
              placeholder="you@example.com"
              required
            />
          </label>

          <label className="field">
            <span>Password</span>
            <input
              type="password"
              value={form.password}
              onChange={(e) => updateField('password', e.target.value)}
              placeholder="Minimum 6 characters"
              required
            />
          </label>

          {localError ? <div className="notice notice-error">{localError}</div> : null}
          {error ? <div className="notice notice-error">{error}</div> : null}

          <div className="modal-actions">
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => {
                setLocalError('')
                setCurrentMode(currentMode === 'signup' ? 'login' : 'signup')
              }}
            >
              {currentMode === 'signup' ? 'Have an account?' : 'Create account'}
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Please wait...' : currentMode === 'signup' ? 'Create account' : 'Sign in'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
