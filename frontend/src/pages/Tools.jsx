import { useState } from 'react'
import { motion } from 'framer-motion'
import { RotateCcw, Cpu, BarChart3, Target, Crosshair, Wrench } from 'lucide-react'
import { retrainAtsModel } from '../api'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { GlowCard } from '../components/ui/glow-card'
import { SpotlightCard } from '../components/ui/spotlight-card'
import { GridPattern } from '../components/ui/grid-pattern'
import { FadeInOnScroll, BlurIn, AnimatedGradientText, NumberTicker } from '../components/ui/animated-text'

export default function Tools() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [summary, setSummary] = useState(null)

  async function handleRetrain() {
    setLoading(true); setError('')
    try { const result = await retrainAtsModel(); setSummary(result?.summary || null) }
    catch (err) { setError(err.message || 'Retraining failed') }
    finally { setLoading(false) }
  }

  const metricCards = summary ? [
    { label: 'Rows', value: summary.rows, icon: BarChart3, color: 'from-blue-500 to-indigo-600', shadowColor: 'shadow-blue-500/20' },
    { label: 'Accuracy', value: Math.round((summary.accuracy || 0) * 100), suffix: '%', icon: Target, color: 'from-emerald-500 to-teal-600', shadowColor: 'shadow-emerald-500/20' },
    { label: 'Precision', value: Math.round((summary.precision || 0) * 100), suffix: '%', icon: Crosshair, color: 'from-violet-500 to-purple-600', shadowColor: 'shadow-violet-500/20' },
    { label: 'Recall', value: Math.round((summary.recall || 0) * 100), suffix: '%', icon: RotateCcw, color: 'from-amber-500 to-orange-600', shadowColor: 'shadow-amber-500/20' },
  ] : []

  return (
    <main className="flex-1 relative overflow-hidden">
      <GridPattern className="absolute inset-0 z-0 opacity-30" />

      <div className="relative z-10 mx-auto max-w-4xl px-4 sm:px-6 py-12 space-y-8">
        {/* Hero */}
        <FadeInOnScroll>
          <div className="flex items-center gap-4 mb-2">
            <motion.div
              whileHover={{ rotate: 10, scale: 1.1 }}
              className="h-12 w-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-xl shadow-emerald-500/25"
            >
              <Wrench className="h-6 w-6 text-white" />
            </motion.div>
            <Badge variant="default">Model tools</Badge>
          </div>
          <BlurIn>
            <h1 className="text-3xl sm:text-4xl font-bold text-slate-900">
              Maintain the{' '}
              <AnimatedGradientText>ATS scoring</AnimatedGradientText>{' '}
              model
            </h1>
          </BlurIn>
          <p className="text-slate-500 mt-3 max-w-lg leading-relaxed">
            Retrain the pair-scoring model from the dataset already stored in the project and refresh the live matcher artifacts.
          </p>
        </FadeInOnScroll>

        {/* Retrain card */}
        <FadeInOnScroll delay={0.1}>
          <GlowCard glowColor="emerald">
            <div className="border-b border-slate-100/60 bg-gradient-to-r from-slate-50/60 to-white/40 p-5 rounded-t-2xl">
              <div className="flex items-center gap-3">
                <motion.div
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.5 }}
                  className="h-9 w-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20"
                >
                  <Cpu className="h-4 w-4 text-white" />
                </motion.div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-600">Training</p>
                  <h3 className="text-base font-bold text-slate-800">Retrain ATS model</h3>
                </div>
              </div>
            </div>
            <div className="p-6 space-y-5">
              <p className="text-sm text-slate-500 leading-relaxed">
                This updates the decision tree classifier and TF-IDF vectorizer used by the ML fit score in resume analysis.
              </p>

              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="inline-block">
                <Button onClick={handleRetrain} disabled={loading} className="gap-2">
                  {loading
                    ? <><RotateCcw className="h-4 w-4 animate-spin" /> Retraining...</>
                    : <><RotateCcw className="h-4 w-4" /> Retrain model</>}
                </Button>
              </motion.div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-xl bg-red-50/80 backdrop-blur-sm border border-red-100 px-4 py-3 text-sm text-red-600"
                >
                  {error}
                </motion.div>
              )}

              {summary && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="grid grid-cols-2 lg:grid-cols-4 gap-4 pt-2"
                >
                  {metricCards.map((m, i) => (
                    <SpotlightCard key={m.label} className="p-4 text-center">
                      <motion.div
                        whileHover={{ rotate: 10, scale: 1.1 }}
                        className={`h-10 w-10 mx-auto rounded-xl bg-gradient-to-br ${m.color} flex items-center justify-center shadow-lg ${m.shadowColor} mb-3`}
                      >
                        <m.icon className="h-5 w-5 text-white" />
                      </motion.div>
                      <p className="text-xs text-slate-400 font-medium">{m.label}</p>
                      <p className="text-2xl font-bold text-slate-800 mt-1">
                        <NumberTicker value={m.value} />{m.suffix || ''}
                      </p>
                    </SpotlightCard>
                  ))}
                </motion.div>
              )}
            </div>
          </GlowCard>
        </FadeInOnScroll>
      </div>
    </main>
  )
}
