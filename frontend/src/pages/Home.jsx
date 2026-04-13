import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useOutletContext } from 'react-router-dom'
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion'
import {
  Upload, Search, Wand2, Trash2, Eye, FileDown, PenTool, Sparkles,
  Brain, Tags, RotateCcw, ChevronDown, CheckCircle2, XCircle, Target,
  BarChart3, AlertTriangle, Zap, ArrowRight, ArrowDown, FileText,
  Check, Loader2,
} from 'lucide-react'
import {
  aiSuggest, analyzeResume, applySuggestions, extractNer, retrainAtsModel,
  rewriteResume, smartDownloadResume, smartParseResume, smartRewriteResume, uploadResume,
} from '../api'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { Textarea } from '../components/ui/textarea'
import { Switch } from '../components/ui/switch'
import { AuroraBackground } from '../components/ui/aurora-background'
import { GridPattern } from '../components/ui/grid-pattern'
import { SpotlightCard } from '../components/ui/spotlight-card'
import { GlowCard } from '../components/ui/glow-card'
import { AnimatedGradientText, LetterPullUp, NumberTicker, FadeInOnScroll, BlurIn } from '../components/ui/animated-text'
import { cn } from '@/lib/utils'

const JD_PRESETS = [
  { id: 'frontend', label: 'Frontend Developer', text: 'Build responsive React interfaces, collaborate with design, optimize performance, and ship accessible product experiences using modern JavaScript, CSS, and REST APIs.' },
  { id: 'analyst', label: 'Data Analyst', text: 'Translate business questions into dashboards, SQL queries, and executive-ready insights with strong communication, Excel, BI tooling, and data storytelling.' },
  { id: 'pm', label: 'Product Manager', text: 'Own roadmap, align cross-functional teams, write clear product requirements, track outcomes, and turn customer insight into shipped improvements.' },
]

const WORKSPACE_KEY = 'resume_workspace'

function normalizeList(items) {
  if (!Array.isArray(items)) return []
  return items.filter(Boolean).map((item) => String(item).trim()).filter(Boolean)
}
function inferKeywords(analysis) {
  if (!analysis) return { matched: [], missing: [] }
  return { matched: normalizeList(analysis.matched_keywords), missing: normalizeList(analysis.missing_keywords) }
}
function buildSmartUpdatedText(mappings = [], acceptedIds = []) {
  const accepted = new Set(acceptedIds)
  const lines = []
  mappings.forEach((m) => {
    if (m.original_heading) lines.push(m.original_heading)
    lines.push(accepted.has(m.original_id) && m.has_changes ? m.improved_content || m.original_content || '' : m.original_content || '')
    lines.push('')
  })
  return lines.join('\n').trim()
}
function buildFallbackSmartResume(text, file) {
  const content = String(text || '').trim()
  if (!content) return { success: true, file_name: file?.name || 'resume', file_type: String(file?.name || '').toLowerCase().endsWith('.docx') ? 'docx' : 'pdf', full_text: '', sections: [], mappings: [], section_count: 0 }
  return { success: true, file_name: file?.name || 'resume', file_type: String(file?.name || '').toLowerCase().endsWith('.docx') ? 'docx' : 'pdf', full_text: content, sections: [{ id: 'full_resume', heading: 'Resume', content }], mappings: [{ original_id: 'full_resume', original_heading: 'Resume', original_content: content, improved_content: content, has_changes: false }], section_count: 1 }
}
function countEntities(nerData) {
  if (!nerData || typeof nerData !== 'object') return 0
  return Object.values(nerData).reduce((t, v) => t + (Array.isArray(v) ? v.length : v ? 1 : 0), 0)
}
function formatPercentScore(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return null
  return Math.round(Number(value) * 100)
}
function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = filename
  document.body.appendChild(a); a.click(); a.remove()
  URL.revokeObjectURL(url)
}

/* ── Step progress indicator ────────────────────────────── */
function StepIndicator({ steps, currentStep }) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {steps.map((step, i) => {
        const done = step.done
        const active = i === currentStep
        return (
          <div key={step.label} className="flex items-center gap-2">
            {i > 0 && <div className={cn('hidden sm:block w-8 h-[2px] rounded-full', done ? 'bg-emerald-400' : 'bg-slate-200')} />}
            <div className={cn(
              'flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all',
              done ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                active ? 'bg-blue-50 text-blue-700 border border-blue-200 animate-pulse' :
                  'bg-slate-50 text-slate-400 border border-slate-200'
            )}>
              {done ? <Check className="h-3 w-3" /> : active ? <Loader2 className="h-3 w-3 animate-spin" /> : <span className="h-3 w-3 flex items-center justify-center text-[10px] font-bold">{i + 1}</span>}
              {step.label}
            </div>
          </div>
        )
      })}
    </div>
  )
}

/* ── Metric card ────────────────────────────────────────── */
function MetricCard({ label, value, icon: Icon, color, delay = 0 }) {
  const colorMap = {
    emerald: { gradient: 'from-emerald-500 to-teal-600', shadow: 'shadow-emerald-500/20', bar: 'from-emerald-400 to-teal-500' },
    blue: { gradient: 'from-blue-500 to-indigo-600', shadow: 'shadow-blue-500/20', bar: 'from-blue-400 to-indigo-500' },
    amber: { gradient: 'from-amber-500 to-orange-600', shadow: 'shadow-amber-500/20', bar: 'from-amber-400 to-orange-500' },
    violet: { gradient: 'from-violet-500 to-purple-600', shadow: 'shadow-violet-500/20', bar: 'from-violet-400 to-purple-500' },
  }
  const c = colorMap[color]
  return (
    <FadeInOnScroll delay={delay}>
      <SpotlightCard className="h-full" spotlightColor={color === 'emerald' ? 'rgba(16,185,129,0.12)' : color === 'blue' ? 'rgba(59,130,246,0.12)' : color === 'amber' ? 'rgba(245,158,11,0.12)' : 'rgba(139,92,246,0.12)'}>
        <div className="p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</p>
              <p className="text-3xl font-extrabold text-slate-800 mt-1.5 tabular-nums">
                {value !== null ? <><NumberTicker value={value} delay={0.3 + delay} />%</> : <span className="text-slate-300">--</span>}
              </p>
            </div>
            <motion.div whileHover={{ scale: 1.1, rotate: 10 }} className={cn('h-11 w-11 rounded-xl bg-gradient-to-br flex items-center justify-center shadow-lg', c.gradient, c.shadow)}>
              <Icon className="h-5 w-5 text-white" />
            </motion.div>
          </div>
          {value !== null && (
            <div className="mt-4 h-2 rounded-full bg-slate-100 overflow-hidden">
              <motion.div className={cn('h-full rounded-full bg-gradient-to-r', c.bar)} initial={{ width: 0 }} whileInView={{ width: `${Math.min(value, 100)}%` }} viewport={{ once: true }} transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1], delay: 0.5 + delay }} />
            </div>
          )}
        </div>
      </SpotlightCard>
    </FadeInOnScroll>
  )
}

/* ══════════════════════════════════════════════════════════
   HOME PAGE
   ══════════════════════════════════════════════════════════ */
export default function Home() {
  const navigate = useNavigate()
  const { user, history, refreshHistory, openAuthModal } = useOutletContext()
  const fileInputRef = useRef(null)
  const heroRef = useRef(null)
  const step2Ref = useRef(null)
  const step3Ref = useRef(null)
  const [dragActive, setDragActive] = useState(false)

  const [resumeFile, setResumeFile] = useState(null)
  const [jobDescription, setJobDescription] = useState('')
  const [loading, setLoading] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [uploadResult, setUploadResult] = useState(null)
  const [analysis, setAnalysis] = useState(null)
  const [aiFeedback, setAiFeedback] = useState('')
  const [nerData, setNerData] = useState(null)
  const [rewriteResult, setRewriteResult] = useState(null)
  const [smartResume, setSmartResume] = useState(null)
  const [acceptedSections, setAcceptedSections] = useState([])
  const [trainingSummary, setTrainingSummary] = useState(null)
  const [showAdvanced, setShowAdvanced] = useState(false)

  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] })
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 150])
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0])

  useEffect(() => {
    try { const saved = localStorage.getItem(WORKSPACE_KEY); if (!saved) return; const w = JSON.parse(saved); if (w.jobDescription) setJobDescription(w.jobDescription) } catch { localStorage.removeItem(WORKSPACE_KEY) }
  }, [])

  useEffect(() => {
    try { localStorage.setItem(WORKSPACE_KEY, JSON.stringify({ jobDescription, uploadResult, analysis, aiFeedback, nerData, rewriteResult, smartResume, acceptedSections })) } catch { }
  }, [jobDescription, uploadResult, analysis, aiFeedback, nerData, rewriteResult, smartResume, acceptedSections])

  const keywordSummary = useMemo(() => inferKeywords(analysis), [analysis])
  const improvedText = useMemo(() => buildSmartUpdatedText(smartResume?.mappings, acceptedSections), [smartResume, acceptedSections])
  const changedSections = useMemo(() => smartResume?.mappings?.filter((i) => i.has_changes) || [], [smartResume])
  const hasWorkspaceData = Boolean(resumeFile || uploadResult || analysis || aiFeedback || nerData || rewriteResult || smartResume || acceptedSections.length)
  const atsScore = formatPercentScore(analysis?.ats_score)
  const mlScore = formatPercentScore(analysis?.ml_score)

  // Derived flow states
  const isUploaded = Boolean(smartResume)
  const isAnalyzed = Boolean(analysis)
  const hasSuggestions = Boolean(aiFeedback)
  const hasRewrites = changedSections.length > 0
  const sectionCount = smartResume?.section_count || smartResume?.mappings?.length || 0

  function syncBuilderWorkspace(sr = smartResume, na = acceptedSections) {
    const sections = sr?.mappings?.map((m) => ({ id: m.original_id, heading: m.original_heading, original: m.original_content || '', draft: na.includes(m.original_id) && m.has_changes ? m.improved_content || m.original_content || '' : m.original_content || '' })) || []
    try { localStorage.setItem(WORKSPACE_KEY, JSON.stringify({ jobDescription, uploadResult, analysis, aiFeedback, nerData, rewriteResult, smartResume: sr, acceptedSections: na, builderSections: sections, builderOriginalText: sr?.full_text || uploadResult?.resume_text || '' })) } catch { }
  }
  function clearWorkspace() { setResumeFile(null); setError(''); setNotice(''); setUploadResult(null); setAnalysis(null); setAiFeedback(''); setNerData(null); setRewriteResult(null); setSmartResume(null); setAcceptedSections([]); setTrainingSummary(null); try { localStorage.removeItem(WORKSPACE_KEY); sessionStorage.removeItem('preview_original'); sessionStorage.removeItem('preview_updated'); sessionStorage.removeItem('preview_summary') } catch { }; if (fileInputRef.current) fileInputRef.current.value = '' }
  async function withLoading(name, task) { setLoading(name); setError(''); setNotice(''); try { await task() } catch (e) { setError(e.message || 'Something went wrong') } finally { setLoading('') } }

  async function handleUploadAndParse() {
    if (!resumeFile) { setError('Choose a PDF or DOCX resume first.'); return }
    await withLoading('upload', async () => {
      const ud = await uploadResume(resumeFile)
      setUploadResult(ud)
      let nn = 'Resume uploaded and parsed successfully!'
      let sd
      try { sd = await smartParseResume(resumeFile) } catch { sd = buildFallbackSmartResume(ud?.resume_text, resumeFile); nn = 'Resume uploaded. Basic parsing used.' }
      const na = (sd.mappings || sd.sections || []).map((s) => s.id || s.original_id).filter(Boolean)
      const nsr = { ...sd, mappings: sd.mappings || sd.sections?.map((s) => ({ original_id: s.id, original_heading: s.heading, original_content: s.content, improved_content: s.content, has_changes: false })) || [] }
      setSmartResume(nsr)
      setAcceptedSections(na)
      syncBuilderWorkspace(nsr, na)
      nn += ` Found ${nsr.section_count || na.length} sections. Now add a job description and click "Analyze & Improve" below.`
      setNotice(nn)
      // Auto-scroll to step 2
      setTimeout(() => step2Ref.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 500)
    })
  }
  async function handleAnalyzeAndSuggest() {
    if (!smartResume?.mappings?.length && !resumeFile) { setError('Upload a resume first.'); return }
    if (!jobDescription.trim()) { setError('Paste a job description so we can compare your resume against it.'); return }
    await withLoading('analyze', async () => {
      // Run analysis
      if (resumeFile) {
        const r = await analyzeResume(resumeFile, jobDescription)
        setAnalysis(r)
        if (user) await refreshHistory()
      }
      // Run AI suggestions in parallel
      if (resumeFile) {
        try {
          const r = await aiSuggest(resumeFile, jobDescription)
          setAiFeedback(typeof r?.ai_feedback === 'string' ? r.ai_feedback : JSON.stringify(r?.ai_feedback || r, null, 2))
        } catch { /* suggestions are optional */ }
      }
      setNotice('Analysis complete! Review your scores below, then click "AI Smart Rewrite" to improve your resume.')
      setTimeout(() => step3Ref.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 500)
    })
  }
  async function handleSmartRewrite() {
    if (!smartResume?.sections?.length && !smartResume?.mappings?.length) { setError('Upload your resume first.'); return }
    const secs = smartResume.sections || smartResume.mappings.map((m) => ({ id: m.original_id, heading: m.original_heading, content: m.original_content }))
    await withLoading('smart-rewrite', async () => {
      const r = await smartRewriteResume(secs, jobDescription)
      const nsr = { ...smartResume, mappings: r.mappings || [] }
      const na = (r.mappings || []).filter((i) => i.has_changes).map((i) => i.original_id)
      setSmartResume(nsr)
      setAcceptedSections(na)
      syncBuilderWorkspace(nsr, na)
      const improved = (r.mappings || []).filter((i) => i.has_changes).length
      setNotice(`Smart rewrite complete! ${improved} section(s) improved. Review the changes below — toggle sections on/off, then download or preview.`)
    })
  }
  async function handleApplySuggestions() {
    if (!aiFeedback) { setError('Run analysis first to get AI suggestions.'); return }
    if (!smartResume?.sections?.length && !smartResume?.mappings?.length) { setError('Upload and parse your resume first.'); return }
    const secs = smartResume.sections || smartResume.mappings.map((m) => ({ id: m.original_id, heading: m.original_heading, content: m.original_content, heading_line: m.heading_line, content_start: m.content_start, content_end: m.content_end, para_start: m.para_start, content_para_start: m.content_para_start, content_para_end: m.content_para_end }))
    await withLoading('apply-suggestions', async () => {
      const r = await applySuggestions(secs, aiFeedback, jobDescription)
      if (!r.mappings?.length || r.sections_improved === 0) { setNotice('No applicable changes from suggestions.'); return }
      const nsr = { ...smartResume, mappings: r.mappings }
      const na = (r.mappings || []).filter((i) => i.has_changes).map((i) => i.original_id)
      setSmartResume(nsr)
      setAcceptedSections(na)
      syncBuilderWorkspace(nsr, na)
      setNotice(`Applied suggestions to ${r.sections_improved} section(s). Review the changes below.`)
    })
  }
  async function handleSuggestions() { if (!resumeFile) { setError('Upload a resume first.'); return }; await withLoading('suggest', async () => { const r = await aiSuggest(resumeFile, jobDescription); setAiFeedback(typeof r?.ai_feedback === 'string' ? r.ai_feedback : JSON.stringify(r?.ai_feedback || r, null, 2)); setNotice('AI suggestions ready. Click "Apply to Resume" to implement them.') }) }
  async function handleEntityExtraction() { if (!resumeFile) { setError('Upload a resume first.'); return }; await withLoading('ner', async () => { const r = await extractNer(resumeFile); setNerData(r); setNotice('Entity extraction complete.') }) }
  async function handleRewriteBullets() { if (!resumeFile) { setError('Upload a resume first.'); return }; await withLoading('rewrite', async () => { const r = await rewriteResume(resumeFile); setRewriteResult(r); setNotice('Quick rewrite complete.') }) }
  function handleToggleSection(sid) { const na = acceptedSections.includes(sid) ? acceptedSections.filter((i) => i !== sid) : [...acceptedSections, sid]; setAcceptedSections(na); syncBuilderWorkspace(smartResume, na) }
  function handlePreview() { const ot = smartResume?.full_text || uploadResult?.resume_text || ''; const ut = improvedText || ot; if (!ot || !ut) { setError('No resume to preview.'); return }; try { sessionStorage.setItem('preview_original', ot); sessionStorage.setItem('preview_updated', ut); sessionStorage.setItem('preview_summary', JSON.stringify({ changedSections: changedSections.length, acceptedSections: acceptedSections.length, missingKeywords: keywordSummary.missing.length })) } catch { }; navigate('/preview', { state: { originalText: ot, updatedText: ut } }) }
  async function handleSmartDownload(fmt) { if (!smartResume?.mappings?.length) { setError('Upload and process your resume first.'); return }; await withLoading('download', async () => { const blob = await smartDownloadResume({ fileName: smartResume.file_name, fileType: smartResume.file_type, mappings: smartResume.mappings, acceptedSections, originalText: smartResume.full_text || uploadResult?.resume_text || '', outputFormat: fmt }); downloadBlob(blob, fmt === 'docx' ? 'resume_improved.docx' : 'resume_improved.pdf'); setNotice(`${fmt.toUpperCase()} downloaded successfully!`) }) }
  async function handleRetrainModel() { await withLoading('retrain', async () => { const r = await retrainAtsModel(); setTrainingSummary(r?.summary || null); setNotice('Model retrained.') }) }
  function handleDrop(e) { e.preventDefault(); setDragActive(false); const f = e.dataTransfer.files?.[0]; if (f && (f.name.endsWith('.pdf') || f.name.endsWith('.docx'))) setResumeFile(f) }

  const flowSteps = [
    { label: 'Upload', done: isUploaded },
    { label: 'Analyze', done: isAnalyzed },
    { label: 'Improve', done: hasRewrites },
    { label: 'Export', done: false },
  ]
  const currentFlowStep = hasRewrites ? 3 : isAnalyzed ? 2 : isUploaded ? 1 : 0

  return (
    <main className="flex-1">
      {/* ═══════════ HERO ═══════════ */}
      <div ref={heroRef} className="relative">
        <AuroraBackground className="min-h-[80vh] flex items-center justify-center">
          <GridPattern className="z-[2]" />
          <motion.div style={{ y: heroY, opacity: heroOpacity }} className="w-full mx-auto max-w-6xl px-4 sm:px-6 py-20">
            <div className="max-w-3xl mx-auto text-center flex flex-col items-center">
              <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }}>
                <Badge variant="default" className="mb-6 text-sm px-4 py-1.5 shadow-lg shadow-emerald-500/10">
                  <Sparkles className="h-3.5 w-3.5 mr-1.5" /> Resume workspace
                </Badge>
              </motion.div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.1]">
                <LetterPullUp words="Improve your resume" />
                <br />
                <BlurIn delay={0.8} className="inline-block mt-2">
                  <AnimatedGradientText className="text-4xl sm:text-5xl lg:text-6xl font-extrabold">in 3 simple steps.</AnimatedGradientText>
                </BlurIn>
              </h1>
              <BlurIn delay={1.2}>
                <p className="mt-6 text-lg sm:text-xl text-slate-500 leading-relaxed max-w-xl mx-auto">
                  Upload your resume, compare it to a job description, and let AI rewrite it — all while preserving your original formatting.
                </p>
              </BlurIn>
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.6, duration: 0.6 }} className="mt-8 flex flex-wrap gap-4 justify-center">
                <Button size="lg" onClick={() => document.getElementById('workspace')?.scrollIntoView({ behavior: 'smooth' })} className="text-base shadow-xl shadow-emerald-500/20">
                  <Upload className="h-5 w-5" /> Get started free
                </Button>
                <Button variant="secondary" size="lg" onClick={() => navigate('/faq')} className="text-base">
                  How it works <ArrowRight className="h-4 w-4" />
                </Button>
              </motion.div>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2, duration: 0.8 }} className="mt-10 flex flex-wrap gap-3 justify-center">
                {['ATS-optimized', 'AI-powered rewriting', 'Format preserved'].map((t) => (
                  <span key={t} className="inline-flex items-center gap-1.5 rounded-full bg-white/60 backdrop-blur-sm border border-slate-200/50 px-3 py-1.5 text-xs font-medium text-slate-500 shadow-sm">
                    <CheckCircle2 className="h-3 w-3 text-emerald-500" /> {t}
                  </span>
                ))}
              </motion.div>
            </div>
          </motion.div>
        </AuroraBackground>
      </div>

      {/* ═══════════ WORKSPACE ═══════════ */}
      <div id="workspace" className="relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/60 to-white/80 pointer-events-none" />
        <GridPattern />
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6 py-16 space-y-8">

          {/* Progress bar */}
          <FadeInOnScroll>
            <div className="flex items-center justify-between flex-wrap gap-4">
              <StepIndicator steps={flowSteps} currentStep={currentFlowStep} />
              {hasWorkspaceData && (
                <Button variant="ghost" size="sm" onClick={clearWorkspace} disabled={!!loading} className="text-slate-400 hover:text-red-500">
                  <Trash2 className="h-3.5 w-3.5" /> Start over
                </Button>
              )}
            </div>
          </FadeInOnScroll>

          {/* Notices/Errors */}
          <AnimatePresence>
            {notice && <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="rounded-xl bg-emerald-50 border border-emerald-100 px-4 py-3 text-sm text-emerald-700 flex items-start gap-2"><CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" /> {notice}</motion.div>}
            {error && <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600 flex items-start gap-2"><XCircle className="h-4 w-4 shrink-0 mt-0.5" /> {error}</motion.div>}
          </AnimatePresence>

          {/* ──────── STEP 1: UPLOAD ──────── */}
          <FadeInOnScroll>
            <GlowCard glowColor="emerald">
              <div className="border-b border-slate-100/80 bg-gradient-to-r from-slate-50/60 to-white/40 p-6 rounded-t-2xl">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-3">
                    <div className={cn('h-10 w-10 rounded-xl flex items-center justify-center shadow-lg', isUploaded ? 'bg-emerald-500 shadow-emerald-500/25' : 'bg-gradient-to-br from-emerald-500 to-teal-600 shadow-emerald-500/25')}>
                      {isUploaded ? <Check className="h-5 w-5 text-white" /> : <Upload className="h-5 w-5 text-white" />}
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-600">Step 1</p>
                      <h2 className="text-lg font-bold text-slate-800">Upload your resume</h2>
                    </div>
                  </div>
                  {isUploaded && (
                    <Badge variant="success" className="text-xs gap-1">
                      <CheckCircle2 className="h-3 w-3" /> {sectionCount} sections parsed
                    </Badge>
                  )}
                </div>
              </div>
              <div className="p-6 space-y-5">
                <input id="resume-input" ref={fileInputRef} type="file" accept=".pdf,.docx" className="hidden" onChange={(e) => setResumeFile(e.target.files?.[0] || null)} />

                {/* Upload zone */}
                {!isUploaded ? (
                  <motion.div
                    whileHover={{ scale: 1.005 }}
                    className={cn(
                      'relative rounded-2xl border-2 border-dashed p-10 text-center transition-all duration-300 cursor-pointer group',
                      dragActive ? 'border-emerald-400 bg-emerald-50/60 scale-[1.005]' : resumeFile ? 'border-emerald-300 bg-emerald-50/30' : 'border-slate-200/80 bg-gradient-to-br from-slate-50/40 to-white/40 hover:border-emerald-300 hover:bg-emerald-50/20',
                    )}
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(e) => { e.preventDefault(); setDragActive(true) }}
                    onDragLeave={() => setDragActive(false)}
                    onDrop={handleDrop}
                  >
                    <div className="flex flex-col items-center gap-4">
                      <motion.div animate={dragActive ? { scale: 1.2, rotate: 10 } : { scale: 1, rotate: 0 }} className={cn('h-16 w-16 rounded-2xl flex items-center justify-center transition-all duration-300', resumeFile ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100/80 text-slate-400 group-hover:bg-emerald-50 group-hover:text-emerald-500')}>
                        {resumeFile ? <FileText className="h-7 w-7" /> : <Upload className="h-7 w-7" />}
                      </motion.div>
                      <div>
                        {resumeFile ? (
                          <>
                            <p className="font-semibold text-emerald-700">{resumeFile.name}</p>
                            <p className="text-sm text-slate-400 mt-1">Click to change file, or click the button below to upload</p>
                          </>
                        ) : (
                          <>
                            <p className="font-semibold text-slate-700">Drop your resume here or click to browse</p>
                            <p className="text-sm text-slate-400 mt-1">Supports PDF and DOCX files</p>
                          </>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  /* Uploaded success state */
                  <div className="rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-50/60 to-teal-50/40 p-5">
                    <div className="flex items-center justify-between flex-wrap gap-3">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-xl bg-emerald-100 flex items-center justify-center">
                          <FileText className="h-6 w-6 text-emerald-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800">{smartResume?.file_name || resumeFile?.name || 'Resume'}</p>
                          <p className="text-xs text-slate-500">{sectionCount} sections detected: {(smartResume?.mappings || []).map(m => m.original_heading).filter(Boolean).join(', ')}</p>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => { clearWorkspace(); }} className="text-slate-400 hover:text-red-500">
                        <Trash2 className="h-3.5 w-3.5" /> Replace
                      </Button>
                    </div>
                  </div>
                )}

                {!isUploaded && (
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button onClick={handleUploadAndParse} disabled={!resumeFile || !!loading} className="w-full sm:w-auto text-base py-5">
                      {loading === 'upload' ? <><Loader2 className="h-4 w-4 animate-spin" /> Uploading &amp; parsing...</> : <><Upload className="h-4 w-4" /> Upload &amp; parse resume</>}
                    </Button>
                  </motion.div>
                )}
              </div>
            </GlowCard>
          </FadeInOnScroll>

          {/* Arrow connector */}
          {isUploaded && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-center">
              <ArrowDown className="h-6 w-6 text-slate-300" />
            </motion.div>
          )}

          {/* ──────── STEP 2: ANALYZE ──────── */}
          <AnimatePresence>
            {isUploaded && (
              <motion.div ref={step2Ref} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                <GlowCard glowColor="blue">
                  <div className="border-b border-slate-100/80 bg-gradient-to-r from-blue-50/40 to-indigo-50/20 p-6 rounded-t-2xl">
                    <div className="flex items-center justify-between flex-wrap gap-3">
                      <div className="flex items-center gap-3">
                        <div className={cn('h-10 w-10 rounded-xl flex items-center justify-center shadow-lg', isAnalyzed ? 'bg-emerald-500 shadow-emerald-500/25' : 'bg-gradient-to-br from-blue-500 to-indigo-600 shadow-blue-500/25')}>
                          {isAnalyzed ? <Check className="h-5 w-5 text-white" /> : <Search className="h-5 w-5 text-white" />}
                        </div>
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-widest text-blue-600">Step 2</p>
                          <h2 className="text-lg font-bold text-slate-800">Analyze against job description</h2>
                        </div>
                      </div>
                      {isAnalyzed && <Badge variant="success" className="text-xs gap-1"><CheckCircle2 className="h-3 w-3" /> Analysis complete</Badge>}
                    </div>
                  </div>
                  <div className="p-6 space-y-5">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-600">Paste the job description you are targeting</label>
                      <Textarea rows={4} value={jobDescription} onChange={(e) => setJobDescription(e.target.value)} placeholder="Paste the target job description here..." />
                      <div className="flex gap-2 flex-wrap">
                        <span className="text-xs text-slate-400 mr-1 self-center">Quick fill:</span>
                        {JD_PRESETS.map((p) => (
                          <motion.button key={p.id} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} type="button" onClick={() => setJobDescription(p.text)} className="rounded-full border border-slate-200/80 bg-white/80 backdrop-blur-sm px-3 py-1.5 text-xs font-medium text-slate-500 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50/50 transition-all shadow-sm cursor-pointer">{p.label}</motion.button>
                        ))}
                      </div>
                    </div>
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      <Button onClick={handleAnalyzeAndSuggest} disabled={!!loading} className="w-full sm:w-auto text-base py-5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
                        {loading === 'analyze' ? <><Loader2 className="h-4 w-4 animate-spin" /> Analyzing &amp; generating suggestions...</> : <><Search className="h-4 w-4" /> Analyze &amp; get suggestions</>}
                      </Button>
                    </motion.div>

                    {/* Analysis results */}
                    {isAnalyzed && (
                      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-5 pt-3 border-t border-slate-100">
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                          <MetricCard label="ATS Score" value={atsScore} icon={Target} color="emerald" />
                          <MetricCard label="ML Confidence" value={mlScore} icon={Brain} color="blue" delay={0.05} />
                          <MetricCard label="Missing Keywords" value={keywordSummary.missing.length || null} icon={AlertTriangle} color="amber" delay={0.1} />
                          <MetricCard label="Matched Keywords" value={keywordSummary.matched.length || null} icon={CheckCircle2} color="violet" delay={0.15} />
                        </div>
                        <div className="grid md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <h3 className="text-sm font-bold text-emerald-600 flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5" /> Matched keywords</h3>
                            <div className="flex flex-wrap gap-1.5">{keywordSummary.matched.length ? keywordSummary.matched.slice(0, 10).map((i) => <Badge key={i} variant="success">{i}</Badge>) : <span className="text-sm text-slate-400">None found</span>}</div>
                          </div>
                          <div className="space-y-2">
                            <h3 className="text-sm font-bold text-amber-600 flex items-center gap-1.5"><AlertTriangle className="h-3.5 w-3.5" /> Missing keywords</h3>
                            <div className="flex flex-wrap gap-1.5">{keywordSummary.missing.length ? keywordSummary.missing.slice(0, 10).map((i) => <Badge key={i} variant="warning">{i}</Badge>) : <span className="text-sm text-slate-400">None missing!</span>}</div>
                          </div>
                        </div>
                        {analysis?.ml_label && (
                          <div className="rounded-xl border border-slate-200/60 bg-slate-50/40 p-4 flex items-center gap-3">
                            <Badge variant={analysis.ml_label === 'Strong' ? 'success' : analysis.ml_label === 'Moderate' ? 'warning' : 'destructive'} className="text-sm px-3 py-1">{analysis.ml_label}</Badge>
                            <span className="text-sm text-slate-500">
                              {analysis.ml_label === 'Strong' ? 'Great match! Your resume aligns well with this role.' : analysis.ml_label === 'Moderate' ? 'Decent match. AI rewriting can help close the gap.' : 'Weak match. Use AI rewriting to align your resume with this role.'}
                            </span>
                          </div>
                        )}
                      </motion.div>
                    )}

                    {/* AI Suggestions */}
                    {hasSuggestions && (
                      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-3 pt-3 border-t border-slate-100">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-bold text-violet-600 flex items-center gap-1.5"><Sparkles className="h-3.5 w-3.5" /> AI Suggestions</h3>
                        </div>
                        <div className="rounded-xl bg-violet-50/40 border border-violet-100 p-4 space-y-2 max-h-48 overflow-auto">
                          {aiFeedback.split('\n').filter(Boolean).slice(0, 10).map((l, i) => (
                            <p key={i} className="text-sm text-slate-600 flex items-start gap-2">
                              <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-violet-400 shrink-0" />
                              {l.replace(/^(REWRITE|KEEP|⚠️|💡|🧠|✅|🔄|🧹|✏️):\s*/i, '')}
                            </p>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </div>
                </GlowCard>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Arrow connector */}
          {isAnalyzed && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-center">
              <ArrowDown className="h-6 w-6 text-slate-300" />
            </motion.div>
          )}

          {/* ──────── STEP 3: IMPROVE & EXPORT ──────── */}
          <AnimatePresence>
            {isAnalyzed && (
              <motion.div ref={step3Ref} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                <GlowCard glowColor="violet">
                  <div className="border-b border-slate-100/80 bg-gradient-to-r from-violet-50/40 to-purple-50/20 p-6 rounded-t-2xl">
                    <div className="flex items-center justify-between flex-wrap gap-3">
                      <div className="flex items-center gap-3">
                        <div className={cn('h-10 w-10 rounded-xl flex items-center justify-center shadow-lg', hasRewrites ? 'bg-emerald-500 shadow-emerald-500/25' : 'bg-gradient-to-br from-violet-500 to-purple-600 shadow-violet-500/25')}>
                          {hasRewrites ? <Check className="h-5 w-5 text-white" /> : <Wand2 className="h-5 w-5 text-white" />}
                        </div>
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-widest text-violet-600">Step 3</p>
                          <h2 className="text-lg font-bold text-slate-800">Improve &amp; export</h2>
                        </div>
                      </div>
                      {hasRewrites && <Badge variant="success" className="text-xs gap-1"><CheckCircle2 className="h-3 w-3" /> {changedSections.length} sections improved</Badge>}
                    </div>
                  </div>
                  <div className="p-6 space-y-5">
                    {!hasRewrites ? (
                      <div className="space-y-4">
                        <p className="text-sm text-slate-500">Choose how you want to improve your resume:</p>
                        <div className="grid sm:grid-cols-2 gap-4">
                          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                            <button onClick={handleSmartRewrite} disabled={!!loading} className="w-full text-left rounded-xl border-2 border-violet-200 bg-gradient-to-r from-violet-50/60 to-purple-50/40 p-5 hover:border-violet-400 hover:shadow-lg hover:shadow-violet-500/10 transition-all cursor-pointer disabled:opacity-50">
                              <div className="flex items-center gap-3 mb-2">
                                <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center"><Wand2 className="h-4 w-4 text-white" /></div>
                                <span className="text-sm font-bold text-slate-800">AI Smart Rewrite</span>
                              </div>
                              <p className="text-xs text-slate-500">Uses AI to rewrite all sections with stronger verbs, better ATS keywords, and clearer achievements.</p>
                              {loading === 'smart-rewrite' && <div className="mt-2 flex items-center gap-1.5 text-xs text-violet-600"><Loader2 className="h-3 w-3 animate-spin" /> Rewriting...</div>}
                            </button>
                          </motion.div>
                          {hasSuggestions && (
                            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                              <button onClick={handleApplySuggestions} disabled={!!loading} className="w-full text-left rounded-xl border-2 border-emerald-200 bg-gradient-to-r from-emerald-50/60 to-teal-50/40 p-5 hover:border-emerald-400 hover:shadow-lg hover:shadow-emerald-500/10 transition-all cursor-pointer disabled:opacity-50">
                                <div className="flex items-center gap-3 mb-2">
                                  <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center"><Sparkles className="h-4 w-4 text-white" /></div>
                                  <span className="text-sm font-bold text-slate-800">Apply Suggestions</span>
                                </div>
                                <p className="text-xs text-slate-500">Applies the specific AI suggestions from Step 2 — fixes weak phrases, adds keywords, and strengthens wording.</p>
                                {loading === 'apply-suggestions' && <div className="mt-2 flex items-center gap-1.5 text-xs text-emerald-600"><Loader2 className="h-3 w-3 animate-spin" /> Applying...</div>}
                              </button>
                            </motion.div>
                          )}
                        </div>
                      </div>
                    ) : (
                      /* Section-by-section changes */
                      <div className="space-y-4">
                        <p className="text-sm text-slate-500">Review each improved section. Toggle the switch to include or exclude changes.</p>
                        {changedSections.map((m, idx) => (
                          <motion.div key={m.original_id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }} className={cn('rounded-xl border p-5 transition-all duration-300', acceptedSections.includes(m.original_id) ? 'border-emerald-200 bg-emerald-50/20 shadow-sm' : 'border-slate-200/60 bg-white/80')}>
                            <div className="flex items-center justify-between mb-4">
                              <h3 className="font-bold text-slate-800">{m.original_heading || 'Untitled'}</h3>
                              <div className="flex items-center gap-2">
                                <span className={cn('text-xs', acceptedSections.includes(m.original_id) ? 'text-emerald-600 font-medium' : 'text-slate-400')}>{acceptedSections.includes(m.original_id) ? 'Accepted' : 'Excluded'}</span>
                                <Switch checked={acceptedSections.includes(m.original_id)} onCheckedChange={() => handleToggleSection(m.original_id)} />
                              </div>
                            </div>
                            <div className="grid md:grid-cols-2 gap-4">
                              <div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Original</p><pre className="text-sm text-slate-600 whitespace-pre-wrap rounded-xl bg-slate-50/80 border border-slate-100 p-3 max-h-48 overflow-auto">{m.original_content}</pre></div>
                              <div><p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest mb-2">Improved</p><pre className="text-sm text-slate-600 whitespace-pre-wrap rounded-xl bg-emerald-50/40 border border-emerald-100 p-3 max-h-48 overflow-auto">{m.improved_content}</pre></div>
                            </div>
                          </motion.div>
                        ))}

                        {/* Export buttons */}
                        <div className="flex flex-wrap gap-3 pt-4 border-t border-slate-100">
                          <Button onClick={handlePreview} className="gap-1.5"><Eye className="h-4 w-4" /> Preview changes</Button>
                          <Button variant="secondary" onClick={() => handleSmartDownload('pdf')} disabled={!!loading}>{loading === 'download' ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Preparing...</> : <><FileDown className="h-4 w-4" /> Download PDF</>}</Button>
                          <Button variant="secondary" onClick={() => handleSmartDownload('docx')} disabled={!!loading}>{loading === 'download' ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Preparing...</> : <><FileDown className="h-4 w-4" /> Download DOCX</>}</Button>
                          <Button variant="ghost" onClick={() => navigate('/builder')} className="gap-1.5"><PenTool className="h-4 w-4" /> Manual editor</Button>
                        </div>

                        {/* Re-run options */}
                        <div className="flex flex-wrap gap-2 pt-2">
                          <span className="text-xs text-slate-400 self-center">Try again:</span>
                          <Button variant="ghost" size="sm" onClick={handleSmartRewrite} disabled={!!loading}><Wand2 className="h-3.5 w-3.5" /> Re-run smart rewrite</Button>
                          {hasSuggestions && <Button variant="ghost" size="sm" onClick={handleApplySuggestions} disabled={!!loading}><Sparkles className="h-3.5 w-3.5" /> Re-apply suggestions</Button>}
                        </div>
                      </div>
                    )}
                  </div>
                </GlowCard>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ──────── ELEVENLABS VOICE WIDGET ──────── */}
          <div
            style={{
              position: 'fixed',
              bottom: '24px',
              right: '24px',
              zIndex: 9999,
              '--el-color-primary': '#10b981',
              '--el-color-primary-hover': '#059669',
              '--el-color-text': '#f8fafc',
              '--el-color-background': '#0f172a',
              '--el-color-border': '#1e293b',
              '--el-color-ring': '#10b981',
              '--el-border-radius': '16px',
            }}
          >
            <elevenlabs-convai agent-id="agent_9101kp43xvs5fmx9p6dfr4cgykzm" />
          </div>

          {/* ──────── ADVANCED TOOLS ──────── */}
          <FadeInOnScroll delay={0.15}>
            <SpotlightCard>
              <button type="button" onClick={() => setShowAdvanced(!showAdvanced)} className="w-full flex items-center justify-between p-6 text-left cursor-pointer hover:bg-slate-50/30 transition-colors rounded-2xl">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-slate-500 to-slate-600 flex items-center justify-center shadow-lg"><Sparkles className="h-5 w-5 text-white" /></div>
                  <div>
                    <span className="font-bold text-slate-700">Advanced tools</span>
                    <p className="text-xs text-slate-400">Entity extraction, quick rewrite, model retraining, history</p>
                  </div>
                </div>
                <motion.div animate={{ rotate: showAdvanced ? 180 : 0 }} transition={{ duration: 0.3 }}><ChevronDown className="h-5 w-5 text-slate-400" /></motion.div>
              </button>
              <AnimatePresence>
                {showAdvanced && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.3 }} className="overflow-hidden">
                    <div className="px-6 pb-6 space-y-6 border-t border-slate-100 pt-5">
                      <div className="flex flex-wrap gap-3">
                        <Button variant="secondary" onClick={handleSuggestions} disabled={!!loading || !resumeFile}>{loading === 'suggest' ? 'Working...' : <><Sparkles className="h-4 w-4" /> AI suggestions</>}</Button>
                        <Button variant="secondary" onClick={handleEntityExtraction} disabled={!!loading || !resumeFile}>{loading === 'ner' ? 'Extracting...' : <><Tags className="h-4 w-4" /> Entities</>}</Button>
                        <Button variant="secondary" onClick={handleRewriteBullets} disabled={!!loading || !resumeFile}>{loading === 'rewrite' ? 'Rewriting...' : <><PenTool className="h-4 w-4" /> Quick rewrite</>}</Button>
                        <Button variant="secondary" onClick={handleRetrainModel} disabled={!!loading}>{loading === 'retrain' ? 'Retraining...' : <><RotateCcw className="h-4 w-4" /> Retrain</>}</Button>
                      </div>
                      {trainingSummary && (<div className="border-t border-slate-100 pt-4"><h3 className="text-sm font-bold text-slate-700 mb-3">Model training</h3><div className="grid grid-cols-2 lg:grid-cols-4 gap-3">{[{ l: 'Rows', v: trainingSummary.rows }, { l: 'Accuracy', v: `${Math.round((trainingSummary.accuracy || 0) * 100)}%` }, { l: 'Precision', v: `${Math.round((trainingSummary.precision || 0) * 100)}%` }, { l: 'Recall', v: `${Math.round((trainingSummary.recall || 0) * 100)}%` }].map((m) => <div key={m.l} className="rounded-xl border border-slate-100 bg-slate-50/50 p-3 text-center"><p className="text-xs text-slate-400">{m.l}</p><p className="text-lg font-bold text-slate-800 mt-1">{m.v}</p></div>)}</div></div>)}
                      {nerData && (<div className="border-t border-slate-100 pt-4"><h3 className="text-sm font-bold text-slate-700 mb-2">Entities</h3><Badge variant="secondary">{countEntities(nerData)} found</Badge></div>)}
                      {uploadResult?.resume_text && (<div className="border-t border-slate-100 pt-4"><h3 className="text-sm font-bold text-slate-700 mb-2">Resume text</h3><pre className="text-sm text-slate-500 whitespace-pre-wrap rounded-xl bg-slate-50 border border-slate-100 p-4 max-h-72 overflow-auto">{smartResume?.full_text || uploadResult.resume_text}</pre></div>)}
                      {rewriteResult && (<div className="border-t border-slate-100 pt-4"><h3 className="text-sm font-bold text-slate-700 mb-2">Quick rewrite</h3><pre className="text-sm text-slate-500 whitespace-pre-wrap rounded-xl bg-slate-50 border border-slate-100 p-4 max-h-56 overflow-auto">{typeof rewriteResult === 'string' ? rewriteResult : JSON.stringify(rewriteResult, null, 2)}</pre></div>)}
                      {user ? (<div className="border-t border-slate-100 pt-4"><h3 className="text-sm font-bold text-slate-700 mb-3">History</h3>{history.length ? <div className="space-y-2">{history.slice(0, 5).map((i) => <div key={i.id} className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/50 px-4 py-3"><span className="text-sm font-medium text-slate-700">{i.file_name || 'Resume'}</span><div className="flex items-center gap-3 text-xs text-slate-400"><span>{i.created_at}</span><Badge variant="outline">ATS {Math.round(i.ats || 0)}%</Badge><Badge variant="outline">ML {Math.round(i.ml || 0)}%</Badge></div></div>)}</div> : <p className="text-sm text-slate-400">Run analysis while signed in to build history.</p>}</div>) : (<div className="border-t border-slate-100 pt-4"><h3 className="text-sm font-bold text-slate-700 mb-2">Save history</h3><p className="text-sm text-slate-400 mb-3">Sign in to save ATS runs.</p><Button variant="secondary" onClick={openAuthModal}>Sign in</Button></div>)}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </SpotlightCard>
          </FadeInOnScroll>
        </div>
      </div>
    </main>
  )
}
