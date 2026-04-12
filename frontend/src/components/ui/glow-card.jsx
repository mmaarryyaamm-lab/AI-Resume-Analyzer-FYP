import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

export function GlowCard({ children, className, glowColor = 'emerald' }) {
  const glowMap = {
    emerald: 'hover:shadow-emerald-500/20 before:from-emerald-500/20 before:to-teal-500/20',
    blue: 'hover:shadow-blue-500/20 before:from-blue-500/20 before:to-indigo-500/20',
    violet: 'hover:shadow-violet-500/20 before:from-violet-500/20 before:to-purple-500/20',
    amber: 'hover:shadow-amber-500/20 before:from-amber-500/20 before:to-orange-500/20',
  }

  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.01 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className={cn(
        'group relative overflow-hidden rounded-2xl border border-slate-200/60 bg-white/80 backdrop-blur-xl shadow-lg transition-all duration-500 hover:shadow-2xl',
        'before:absolute before:inset-0 before:rounded-2xl before:bg-gradient-to-br before:opacity-0 before:transition-opacity before:duration-500 hover:before:opacity-100',
        glowMap[glowColor],
        className,
      )}
    >
      <div className="relative z-10">{children}</div>
    </motion.div>
  )
}
