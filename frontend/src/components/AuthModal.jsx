import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Mail, Lock, User, Sparkles, ArrowRight } from 'lucide-react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from './ui/dialog'
import { Button } from './ui/button'
import { Input } from './ui/input'

const initialForm = { name: '', email: '', password: '' }

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
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose() }}>
      <DialogContent className="sm:max-w-md overflow-hidden">
        {/* Top glow accent */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-emerald-500/60 to-transparent" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[200px] h-[80px] bg-[radial-gradient(ellipse,_rgba(16,185,129,0.08)_0%,_transparent_70%)]" />

        <DialogHeader>
          <div className="flex items-center gap-2.5 mb-2">
            <motion.div
              whileHover={{ rotate: 10, scale: 1.1 }}
              className="h-9 w-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20"
            >
              <Sparkles className="h-4 w-4 text-white" />
            </motion.div>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-600">Account</span>
          </div>
          <DialogTitle className="text-xl">
            {currentMode === 'signup' ? 'Create your account' : 'Welcome back'}
          </DialogTitle>
          <DialogDescription>
            {currentMode === 'signup'
              ? 'Sign up to save your analysis history and settings.'
              : 'Sign in to access your saved resume analyses.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid gap-4 mt-3">
          <AnimatePresence mode="wait">
            {currentMode === 'signup' && (
              <motion.div
                key="name-field"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
              >
                <label className="grid gap-2">
                  <span className="text-sm font-medium text-slate-600 flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5 text-emerald-500" /> Full name
                  </span>
                  <Input
                    value={form.name}
                    onChange={(e) => updateField('name', e.target.value)}
                    placeholder="Aftab Ahmad"
                  />
                </label>
              </motion.div>
            )}
          </AnimatePresence>

          <label className="grid gap-2">
            <span className="text-sm font-medium text-slate-600 flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5 text-emerald-500" /> Email
            </span>
            <Input
              type="email"
              value={form.email}
              onChange={(e) => updateField('email', e.target.value)}
              placeholder="you@example.com"
              required
            />
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-medium text-slate-600 flex items-center gap-1.5">
              <Lock className="h-3.5 w-3.5 text-emerald-500" /> Password
            </span>
            <Input
              type="password"
              value={form.password}
              onChange={(e) => updateField('password', e.target.value)}
              placeholder="Minimum 6 characters"
              required
            />
          </label>

          {(localError || error) && (
            <motion.div
              initial={{ opacity: 0, y: -4, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className="rounded-xl bg-red-50/80 backdrop-blur-sm border border-red-100 px-4 py-3 text-sm text-red-600"
            >
              {localError || error}
            </motion.div>
          )}

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              className="text-sm text-slate-400 hover:text-emerald-600 transition-colors cursor-pointer"
              onClick={() => {
                setLocalError('')
                setCurrentMode(currentMode === 'signup' ? 'login' : 'signup')
              }}
            >
              {currentMode === 'signup' ? 'Already have an account?' : 'Create an account'}
            </button>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button type="submit" disabled={loading} className="gap-1.5">
                {loading ? 'Please wait...' : currentMode === 'signup' ? 'Create account' : 'Sign in'}
                {!loading && <ArrowRight className="h-3.5 w-3.5" />}
              </Button>
            </motion.div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
