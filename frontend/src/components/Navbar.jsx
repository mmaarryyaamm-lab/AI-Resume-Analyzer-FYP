import { Link, useLocation } from 'react-router-dom'
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion'
import { FileText, Hammer, HelpCircle, Eye, LogOut, Menu, X, Sparkles } from 'lucide-react'
import { useState } from 'react'
import Logo from './Logo'
import { Button } from './ui/button'
import { cn } from '@/lib/utils'

const navLinks = [
  { to: '/', label: 'Workspace', icon: FileText },
  { to: '/builder', label: 'Builder', icon: Hammer },
  { to: '/preview', label: 'Preview', icon: Eye },
  { to: '/faq', label: 'FAQ', icon: HelpCircle },
]

export default function Navbar({ user, sessionLoading, onOpenAuth, onLogout }) {
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)
  const { scrollY } = useScroll()
  const bgOpacity = useTransform(scrollY, [0, 100], [0.6, 0.95])
  const borderOpacity = useTransform(scrollY, [0, 100], [0, 1])
  const blur = useTransform(scrollY, [0, 100], [8, 20])

  return (
    <motion.header
      className="sticky top-0 z-50"
      initial={{ y: -80 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', stiffness: 200, damping: 30 }}
    >
      <motion.div
        className="absolute inset-0 border-b"
        style={{
          backgroundColor: `rgba(255,255,255,${bgOpacity.get()})`,
          backdropFilter: `blur(${blur.get()}px)`,
          borderColor: `rgba(226,232,240,${borderOpacity.get()})`,
        }}
      />
      {/* Glow line at top */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent" />

      <div className="relative mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-3 group">
          <motion.span
            whileHover={{ scale: 1.1, rotate: 5 }}
            whileTap={{ scale: 0.95 }}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/25 group-hover:shadow-emerald-500/40 transition-shadow duration-300"
          >
            <Logo size={20} />
          </motion.span>
          <span className="hidden sm:flex flex-col">
            <span className="text-sm font-bold text-slate-800 tracking-tight">AI Resume Analyzer</span>
            <span className="text-[10px] text-slate-400 font-medium tracking-wide uppercase">ATS-ready workspace</span>
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-0.5 bg-slate-100/60 backdrop-blur-sm rounded-full p-1 border border-slate-200/50">
          {navLinks.map((link) => {
            const active = location.pathname === link.to || (link.to === '/' && location.pathname === '/')
            const Icon = link.icon
            return (
              <Link
                key={link.to}
                to={link.to}
                className={cn(
                  'relative flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition-all duration-300',
                  active ? 'text-white' : 'text-slate-500 hover:text-slate-700',
                )}
              >
                {active && (
                  <motion.div
                    layoutId="nav-pill"
                    className="absolute inset-0 rounded-full bg-gradient-to-r from-emerald-600 to-teal-600 shadow-lg shadow-emerald-500/25"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-1.5">
                  <Icon className="h-3.5 w-3.5" />
                  {link.label}
                </span>
              </Link>
            )
          })}
        </nav>

        <div className="flex items-center gap-3">
          {sessionLoading ? (
            <div className="h-8 w-20 rounded-full bg-slate-100 animate-pulse" />
          ) : user ? (
            <div className="flex items-center gap-2">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="hidden sm:flex items-center gap-2 rounded-full bg-white/80 backdrop-blur-sm border border-slate-100 px-3 py-1.5 shadow-sm"
              >
                <div className="h-6 w-6 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-[10px] font-bold text-white shadow-inner">
                  {(user.name || user.email || '?')[0].toUpperCase()}
                </div>
                <span className="text-sm font-medium text-slate-600 max-w-[120px] truncate">{user.name || user.email}</span>
              </motion.div>
              <Button variant="ghost" size="icon" onClick={onLogout} className="text-slate-400 hover:text-red-500 h-8 w-8">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button size="sm" onClick={onOpenAuth} className="gap-1.5">
                <Sparkles className="h-3.5 w-3.5" /> Sign in
              </Button>
            </motion.div>
          )}

          <button
            className="md:hidden p-2 rounded-xl hover:bg-slate-100 text-slate-500 transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-slate-100 bg-white/95 backdrop-blur-xl overflow-hidden"
          >
            <nav className="flex flex-col p-3 gap-1">
              {navLinks.map((link, i) => {
                const active = location.pathname === link.to
                const Icon = link.icon
                return (
                  <motion.div
                    key={link.to}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <Link
                      to={link.to}
                      onClick={() => setMobileOpen(false)}
                      className={cn(
                        'flex items-center gap-2.5 rounded-xl px-4 py-3 text-sm font-medium transition-all',
                        active ? 'bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-700 border border-emerald-100' : 'text-slate-600 hover:bg-slate-50',
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {link.label}
                    </Link>
                  </motion.div>
                )
              })}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  )
}
