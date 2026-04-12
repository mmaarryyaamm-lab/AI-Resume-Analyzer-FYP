import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, FileDown, Eye, GitCompare, FileText, CheckCircle2, AlertTriangle } from 'lucide-react'
import { downloadUpdated, previewDiff } from '../api'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { SpotlightCard } from '../components/ui/spotlight-card'
import { GlowCard } from '../components/ui/glow-card'
import { GridPattern } from '../components/ui/grid-pattern'
import { FadeInOnScroll, BlurIn, NumberTicker } from '../components/ui/animated-text'

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

export default function Preview() {
  const navigate = useNavigate()
  const location = useLocation()
  const state = location.state || {}
  const originalText = state.originalText || sessionStorage.getItem('preview_original') || ''
  const updatedText = state.updatedText || sessionStorage.getItem('preview_updated') || ''

  const [html, setHtml] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [downloading, setDownloading] = useState('')

  const summary = useMemo(() => {
    try { return JSON.parse(sessionStorage.getItem('preview_summary') || '{}') } catch { return {} }
  }, [])

  useEffect(() => {
    if (!originalText || !updatedText) return
    setLoading(true)
    previewDiff(originalText, updatedText)
      .then((result) => { setHtml(result?.html || ''); setError('') })
      .catch((err) => setError(err.message || 'Unable to build preview'))
      .finally(() => setLoading(false))
  }, [originalText, updatedText])

  async function handleDownload(format) {
    try {
      setDownloading(format)
      const blob = await downloadUpdated(updatedText, format)
      downloadBlob(blob, format === 'docx' ? 'resume_preview.docx' : 'resume_preview.pdf')
    } catch (err) { setError(err.message || 'Download failed') } finally { setDownloading('') }
  }

  if (!originalText || !updatedText) {
    return (
      <main className="flex-1 relative overflow-hidden">
        <GridPattern className="absolute inset-0 z-0 opacity-40" />
        <div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6 py-16">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 25 }}
            className="flex flex-col items-center justify-center text-center"
          >
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              className="h-20 w-20 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mb-6 shadow-2xl shadow-blue-500/30"
            >
              <Eye className="h-9 w-9 text-white" />
            </motion.div>
            <BlurIn>
              <h2 className="text-3xl font-bold text-slate-800 mb-3">No preview data yet</h2>
            </BlurIn>
            <p className="text-slate-500 max-w-md mb-8 leading-relaxed">
              Return to the workspace, upload a resume, and create a smart rewrite before opening preview.
            </p>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button onClick={() => navigate('/')} className="gap-2">
                <ArrowLeft className="h-4 w-4" /> Back to workspace
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </main>
    )
  }

  const metrics = [
    { label: 'Changed sections', value: summary.changedSections ?? 0, fallback: '--', sub: 'Section-level updates', icon: GitCompare, color: 'from-blue-500 to-indigo-600', glow: 'blue' },
    { label: 'Accepted sections', value: summary.acceptedSections ?? 0, fallback: '--', sub: 'Included in this preview', icon: CheckCircle2, color: 'from-emerald-500 to-teal-600', glow: 'emerald' },
    { label: 'Missing keywords', value: summary.missingKeywords ?? 0, fallback: '--', sub: 'ATS gaps to review', icon: AlertTriangle, color: 'from-amber-500 to-orange-600', glow: 'amber' },
  ]

  return (
    <main className="flex-1 relative overflow-hidden">
      <GridPattern className="absolute inset-0 z-0 opacity-30" />

      <div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6 py-8 space-y-8">
        {/* Header */}
        <FadeInOnScroll>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <motion.div
                whileHover={{ rotate: 10, scale: 1.1 }}
                className="h-12 w-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-xl shadow-blue-500/25"
              >
                <Eye className="h-6 w-6 text-white" />
              </motion.div>
              <div>
                <Badge variant="default" className="mb-1">Preview</Badge>
                <h2 className="text-2xl font-bold text-slate-900">Compare original with improved draft</h2>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="gap-1.5">
                <ArrowLeft className="h-4 w-4" /> Back
              </Button>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button variant="secondary" size="sm" onClick={() => handleDownload('pdf')} disabled={!!downloading}>
                  {downloading === 'pdf' ? 'Downloading...' : <><FileDown className="h-4 w-4" /> PDF</>}
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button size="sm" onClick={() => handleDownload('docx')} disabled={!!downloading}>
                  {downloading === 'docx' ? 'Downloading...' : <><FileDown className="h-4 w-4" /> DOCX</>}
                </Button>
              </motion.div>
            </div>
          </div>
        </FadeInOnScroll>

        {/* Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {metrics.map((m, i) => (
            <FadeInOnScroll key={m.label} delay={i * 0.1}>
              <SpotlightCard className="p-5">
                <div className="flex items-start gap-4">
                  <div className={`h-11 w-11 rounded-xl bg-gradient-to-br ${m.color} flex items-center justify-center shadow-lg shrink-0`}>
                    <m.icon className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 font-medium">{m.label}</p>
                    <p className="text-2xl font-bold text-slate-800">
                      {typeof m.value === 'number' && m.value > 0
                        ? <NumberTicker value={m.value} />
                        : m.fallback}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">{m.sub}</p>
                  </div>
                </div>
              </SpotlightCard>
            </FadeInOnScroll>
          ))}
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl bg-red-50/80 backdrop-blur-sm border border-red-100 px-4 py-3 text-sm text-red-600"
          >
            {error}
          </motion.div>
        )}

        {/* Diff preview */}
        <FadeInOnScroll delay={0.15}>
          <GlowCard glowColor="blue">
            <div className="border-b border-slate-100/60 bg-gradient-to-r from-slate-50/60 to-white/40 p-5 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                    <GitCompare className="h-4 w-4 text-white" />
                  </div>
                  <h3 className="text-base font-bold text-slate-800">Difference view</h3>
                </div>
                <Badge variant={loading ? 'warning' : 'success'}>{loading ? 'Generating...' : 'Ready'}</Badge>
              </div>
            </div>
            <div>
              {loading ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                    className="h-14 w-14 rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center mb-4"
                  >
                    <GitCompare className="h-7 w-7 text-blue-500" />
                  </motion.div>
                  <p className="font-medium text-slate-600">Building diff preview...</p>
                  <p className="text-sm text-slate-400">Comparing original and updated resume line by line.</p>
                </div>
              ) : (
                <iframe title="Resume diff preview" className="w-full min-h-[520px] border-0 rounded-b-2xl bg-white" srcDoc={html} />
              )}
            </div>
          </GlowCard>
        </FadeInOnScroll>

        {/* Side-by-side text */}
        <div className="grid md:grid-cols-2 gap-4">
          <FadeInOnScroll direction="left" delay={0.2}>
            <GlowCard glowColor="blue" className="h-full">
              <div className="border-b border-slate-100/60 bg-gradient-to-r from-slate-50/60 to-white/40 p-4 rounded-t-2xl">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-slate-400" />
                  <h4 className="text-sm font-bold text-slate-700">Original text</h4>
                </div>
              </div>
              <div className="p-4">
                <pre className="text-sm text-slate-500 whitespace-pre-wrap rounded-xl bg-slate-50/60 backdrop-blur-sm border border-slate-100/50 p-4 max-h-80 overflow-auto">{originalText}</pre>
              </div>
            </GlowCard>
          </FadeInOnScroll>
          <FadeInOnScroll direction="right" delay={0.2}>
            <GlowCard glowColor="emerald" className="h-full">
              <div className="border-b border-emerald-100/60 bg-gradient-to-r from-emerald-50/40 to-teal-50/20 p-4 rounded-t-2xl">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-emerald-500" />
                  <h4 className="text-sm font-bold text-emerald-700">Updated text</h4>
                </div>
              </div>
              <div className="p-4">
                <pre className="text-sm text-slate-600 whitespace-pre-wrap rounded-xl bg-emerald-50/30 backdrop-blur-sm border border-emerald-100/50 p-4 max-h-80 overflow-auto">{updatedText}</pre>
              </div>
            </GlowCard>
          </FadeInOnScroll>
        </div>
      </div>
    </main>
  )
}
