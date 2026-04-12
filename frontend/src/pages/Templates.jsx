import { motion } from 'framer-motion'
import { BookOpen, CheckCircle2 } from 'lucide-react'
import { Badge } from '../components/ui/badge'
import { SpotlightCard } from '../components/ui/spotlight-card'
import { GridPattern } from '../components/ui/grid-pattern'
import { FadeInOnScroll, BlurIn, AnimatedGradientText } from '../components/ui/animated-text'

const samples = [
  {
    id: 'engineering', role: 'Software Engineer',
    summary: 'Transforms vague build work into measurable impact, clearer stack ownership, and role-aligned keywords.',
    strengths: ['Performance metrics added', 'Tech stack clarified', 'Leadership impact made visible'],
    color: 'from-emerald-500 to-teal-600',
    shadowColor: 'shadow-emerald-500/20',
  },
  {
    id: 'analytics', role: 'Data Analyst',
    summary: 'Pulls buried tools and reporting wins into recruiter-friendly bullets with business language.',
    strengths: ['SQL and BI tools surfaced', 'Stakeholder outcomes emphasized', 'Dashboards tied to decisions'],
    color: 'from-blue-500 to-indigo-600',
    shadowColor: 'shadow-blue-500/20',
  },
  {
    id: 'product', role: 'Product Manager',
    summary: 'Reframes task-oriented descriptions around ownership, roadmap decisions, and shipped outcomes.',
    strengths: ['Discovery work clarified', 'Cross-functional leadership highlighted', 'Outcome language strengthened'],
    color: 'from-violet-500 to-purple-600',
    shadowColor: 'shadow-violet-500/20',
  },
]

export default function Templates() {
  return (
    <main className="flex-1 relative overflow-hidden">
      <GridPattern className="absolute inset-0 z-0 opacity-30" />

      <div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6 py-12">
        {/* Hero */}
        <FadeInOnScroll className="mb-12">
          <div className="flex items-center gap-4 mb-4">
            <motion.div
              whileHover={{ rotate: 10, scale: 1.1 }}
              className="h-12 w-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-xl shadow-emerald-500/25"
            >
              <BookOpen className="h-6 w-6 text-white" />
            </motion.div>
            <Badge variant="default">Reference gallery</Badge>
          </div>
          <BlurIn>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">
              Templates that show what{' '}
              <AnimatedGradientText>professional</AnimatedGradientText>{' '}
              looks like
            </h2>
          </BlurIn>
          <p className="text-slate-500 mt-3 max-w-xl leading-relaxed">
            See how AI Resume Analyzer transforms real resume sections for different roles.
          </p>
        </FadeInOnScroll>

        {/* Template cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {samples.map((sample, i) => (
            <FadeInOnScroll key={sample.id} delay={i * 0.12}>
              <SpotlightCard className="h-full p-6">
                <div className="flex items-center gap-3 mb-5">
                  <motion.div
                    whileHover={{ rotate: 10, scale: 1.1 }}
                    className={`h-11 w-11 rounded-xl bg-gradient-to-br ${sample.color} flex items-center justify-center shadow-lg ${sample.shadowColor}`}
                  >
                    <BookOpen className="h-5 w-5 text-white" />
                  </motion.div>
                  <Badge variant="secondary">{sample.role}</Badge>
                </div>

                <h3 className="text-base font-bold text-slate-800 leading-snug mb-4">{sample.summary}</h3>

                <div className="grid grid-cols-2 gap-3 mb-5">
                  <div className="rounded-xl border border-slate-100/60 bg-slate-50/40 backdrop-blur-sm p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">Before</p>
                    <p className="text-xs text-slate-500">Generic bullets, low keyword clarity, and no visual hierarchy.</p>
                  </div>
                  <div className="rounded-xl border border-emerald-100/60 bg-emerald-50/30 backdrop-blur-sm p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-500 mb-1">After</p>
                    <p className="text-xs text-slate-600">Sharper bullets, cleaner structure, and stronger role alignment.</p>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  {sample.strengths.map((s) => (
                    <div key={s} className="flex items-center gap-2 text-xs text-slate-600">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                      {s}
                    </div>
                  ))}
                </div>
              </SpotlightCard>
            </FadeInOnScroll>
          ))}
        </div>
      </div>
    </main>
  )
}
