import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { PenTool, Eye, ArrowLeft, FileText, Hash, Layers, Sparkles } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { Input } from '../components/ui/input'
import { Textarea } from '../components/ui/textarea'
import { GlowCard } from '../components/ui/glow-card'
import { GridPattern } from '../components/ui/grid-pattern'
import { FadeInOnScroll, BlurIn } from '../components/ui/animated-text'
import { cn } from '@/lib/utils'

const WORKSPACE_KEY = 'resume_workspace'

function buildText(sections) {
  return sections.map((s) => `${s.heading || 'Section'}\n${s.draft || ''}`.trim()).join('\n\n').trim()
}

export default function Builder() {
  const navigate = useNavigate()
  const [sections, setSections] = useState([])
  const [activeSectionId, setActiveSectionId] = useState('')

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(WORKSPACE_KEY) || '{}')
      const builderSections = saved.builderSections || []
      setSections(builderSections)
      setActiveSectionId(builderSections[0]?.id || '')
    } catch { setSections([]) }
  }, [])

  const activeSection = useMemo(
    () => sections.find((s) => s.id === activeSectionId) || sections[0],
    [sections, activeSectionId],
  )

  const wordCount = useMemo(() => buildText(sections).split(/\s+/).filter(Boolean).length, [sections])

  function updateSection(id, key, value) {
    const nextSections = sections.map((s) => (s.id === id ? { ...s, [key]: value } : s))
    setSections(nextSections)
    try {
      const saved = JSON.parse(localStorage.getItem(WORKSPACE_KEY) || '{}')
      localStorage.setItem(WORKSPACE_KEY, JSON.stringify({ ...saved, builderSections: nextSections }))
    } catch { /* ignore */ }
  }

  function openPreview() {
    const originalText = sections.map((s) => `${s.heading}\n${s.original}`.trim()).join('\n\n')
    const updatedText = buildText(sections)
    sessionStorage.setItem('preview_original', originalText)
    sessionStorage.setItem('preview_updated', updatedText)
    navigate('/preview', { state: { originalText, updatedText } })
  }

  if (!sections.length) {
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
              className="h-20 w-20 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center mb-6 shadow-2xl shadow-violet-500/30"
            >
              <PenTool className="h-9 w-9 text-white" />
            </motion.div>
            <BlurIn>
              <h2 className="text-3xl font-bold text-slate-800 mb-3">Builder is ready when your resume is.</h2>
            </BlurIn>
            <p className="text-slate-500 max-w-md mb-8 leading-relaxed">
              Upload and parse a resume from the workspace first. The builder uses those parsed sections as editable blocks.
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

  return (
    <main className="flex-1 relative overflow-hidden">
      <GridPattern className="absolute inset-0 z-0 opacity-30" />
      <div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6 py-8">
        {/* Header */}
        <FadeInOnScroll className="mb-8">
          <div className="flex items-center gap-4">
            <motion.div
              whileHover={{ rotate: 10, scale: 1.1 }}
              className="h-12 w-12 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-xl shadow-violet-500/25"
            >
              <PenTool className="h-6 w-6 text-white" />
            </motion.div>
            <div>
              <Badge variant="default" className="mb-1 bg-violet-500 hover:bg-violet-600">Builder</Badge>
              <h1 className="text-2xl font-bold text-slate-900">Section Editor</h1>
            </div>
          </div>
        </FadeInOnScroll>

        <div className="grid lg:grid-cols-[280px_1fr] gap-6 items-start">
          {/* Sidebar */}
          <FadeInOnScroll direction="left">
            <GlowCard glowColor="violet" className="lg:sticky lg:top-24">
              <div className="p-5">
                <div className="flex items-center gap-3 mb-5">
                  <Layers className="h-4 w-4 text-violet-500" />
                  <p className="text-sm font-semibold text-slate-700">Sections</p>
                  <Badge variant="secondary" className="ml-auto text-[10px]">{sections.length}</Badge>
                </div>
                <div className="space-y-2">
                  {sections.map((section, i) => (
                    <motion.button
                      key={section.id}
                      type="button"
                      onClick={() => setActiveSectionId(section.id)}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      whileHover={{ x: 4 }}
                      className={cn(
                        'w-full text-left rounded-xl border p-3 transition-all duration-200 cursor-pointer',
                        activeSection?.id === section.id
                          ? 'border-violet-200 bg-gradient-to-r from-violet-50/80 to-purple-50/60 shadow-sm'
                          : 'border-transparent hover:border-slate-200/60 hover:bg-white/60'
                      )}
                    >
                      <p className="text-sm font-medium text-slate-700 truncate">{section.heading || 'Untitled section'}</p>
                      <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                        <Hash className="h-3 w-3" />
                        {(section.draft || '').split(/\s+/).filter(Boolean).length} words
                      </p>
                    </motion.button>
                  ))}
                </div>
              </div>
            </GlowCard>
          </FadeInOnScroll>

          {/* Main editor */}
          <div className="space-y-6">
            <FadeInOnScroll delay={0.1}>
              <GlowCard glowColor="emerald">
                <div className="border-b border-slate-100/60 bg-gradient-to-r from-slate-50/60 to-white/40 backdrop-blur-sm p-5 rounded-t-2xl">
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                        <FileText className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-600">Editing</p>
                        <h3 className="text-lg font-bold text-slate-800">{activeSection?.heading || 'Section'}</h3>
                      </div>
                    </div>
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button variant="secondary" size="sm" onClick={openPreview} className="gap-1.5">
                        <Eye className="h-4 w-4" /> Preview draft
                      </Button>
                    </motion.div>
                  </div>
                </div>
                <div className="p-6 space-y-5">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-600">Section heading</label>
                    <Input
                      value={activeSection?.heading || ''}
                      onChange={(e) => updateSection(activeSection.id, 'heading', e.target.value)}
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-400 flex items-center gap-1.5">
                        <FileText className="h-3.5 w-3.5" /> Original content
                      </label>
                      <Textarea rows={14} value={activeSection?.original || ''} readOnly className="bg-slate-50/60 opacity-70 backdrop-blur-sm" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-emerald-600 flex items-center gap-1.5">
                        <Sparkles className="h-3.5 w-3.5" /> Editable draft
                      </label>
                      <Textarea
                        rows={14}
                        value={activeSection?.draft || ''}
                        onChange={(e) => updateSection(activeSection.id, 'draft', e.target.value)}
                        className="border-emerald-200 focus-visible:ring-emerald-500/30"
                      />
                    </div>
                  </div>
                </div>
              </GlowCard>
            </FadeInOnScroll>

            <FadeInOnScroll delay={0.2}>
              <GlowCard glowColor="blue">
                <div className="border-b border-slate-100/60 bg-gradient-to-r from-slate-50/60 to-white/40 p-5 rounded-t-2xl">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Layers className="h-4 w-4 text-blue-500" />
                      <h3 className="text-base font-bold text-slate-800">Compiled resume</h3>
                    </div>
                    <Badge variant="secondary" className="font-mono">{wordCount} words</Badge>
                  </div>
                </div>
                <div className="p-6">
                  <pre className="text-sm text-slate-500 whitespace-pre-wrap rounded-xl bg-slate-50/60 backdrop-blur-sm border border-slate-100/50 p-4 max-h-80 overflow-auto">
                    {buildText(sections)}
                  </pre>
                </div>
              </GlowCard>
            </FadeInOnScroll>
          </div>
        </div>
      </div>
    </main>
  )
}
