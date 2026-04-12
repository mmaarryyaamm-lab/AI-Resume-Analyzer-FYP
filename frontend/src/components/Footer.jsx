import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FileText, Hammer, Eye, BookOpen, HelpCircle, Shield, ArrowUpRight } from 'lucide-react'
import Logo from './Logo'
import { FadeInOnScroll } from './ui/animated-text'

const productLinks = [
  { to: '/', label: 'Workspace', icon: FileText },
  { to: '/builder', label: 'Builder', icon: Hammer },
  { to: '/preview', label: 'Preview', icon: Eye },
]

const guideLinks = [
  { to: '/templates', label: 'Templates', icon: BookOpen },
  { to: '/faq', label: 'FAQ', icon: HelpCircle },
  { to: '/privacy', label: 'Privacy', icon: Shield },
]

export default function Footer() {
  return (
    <footer className="relative mt-auto border-t border-slate-200/30 overflow-hidden">
      {/* Subtle gradient bg */}
      <div className="absolute inset-0 bg-gradient-to-t from-slate-50/80 to-white/40 backdrop-blur-sm" />
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[radial-gradient(ellipse,_rgba(16,185,129,0.06)_0%,_transparent_70%)]" />

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6 py-14">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          <FadeInOnScroll className="md:col-span-2" delay={0}>
            <div className="flex items-center gap-3 mb-5">
              <motion.span
                whileHover={{ rotate: 10 }}
                className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/20"
              >
                <Logo size={22} />
              </motion.span>
              <span>
                <p className="text-sm font-bold text-slate-800 tracking-tight">AI Resume Analyzer</p>
                <p className="text-[10px] text-slate-400 font-medium tracking-wider uppercase">Sharper resumes, faster</p>
              </span>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed max-w-md">
              Upload, analyze, rewrite, preview, and ship a cleaner resume from one workspace instead of juggling separate tools.
            </p>
          </FadeInOnScroll>

          <FadeInOnScroll delay={0.1}>
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-5">Product</h4>
            <div className="flex flex-col gap-3">
              {productLinks.map((l) => (
                <Link key={l.to} to={l.to} className="group flex items-center gap-2 text-sm text-slate-400 hover:text-emerald-600 transition-colors">
                  <l.icon className="h-3.5 w-3.5" />
                  {l.label}
                  <ArrowUpRight className="h-3 w-3 opacity-0 -translate-y-0.5 group-hover:opacity-100 group-hover:translate-y-0 transition-all" />
                </Link>
              ))}
            </div>
          </FadeInOnScroll>

          <FadeInOnScroll delay={0.2}>
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-5">Guidance</h4>
            <div className="flex flex-col gap-3">
              {guideLinks.map((l) => (
                <Link key={l.to} to={l.to} className="group flex items-center gap-2 text-sm text-slate-400 hover:text-emerald-600 transition-colors">
                  <l.icon className="h-3.5 w-3.5" />
                  {l.label}
                  <ArrowUpRight className="h-3 w-3 opacity-0 -translate-y-0.5 group-hover:opacity-100 group-hover:translate-y-0 transition-all" />
                </Link>
              ))}
            </div>
          </FadeInOnScroll>
        </div>

        <div className="mt-12 pt-6 border-t border-slate-100/50 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-slate-400">&copy; {new Date().getFullYear()} AI Resume Analyzer</p>
          <div className="flex items-center gap-1 text-xs text-slate-300">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Designed for ATS-safe resume workflows
          </div>
        </div>
      </div>
    </footer>
  )
}
