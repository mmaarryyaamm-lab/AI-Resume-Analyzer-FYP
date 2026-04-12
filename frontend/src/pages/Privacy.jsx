import { motion } from 'framer-motion'
import { Shield, Eye, Database, Settings, Lock } from 'lucide-react'
import { Badge } from '../components/ui/badge'
import { GlowCard } from '../components/ui/glow-card'
import { GridPattern } from '../components/ui/grid-pattern'
import { FadeInOnScroll, BlurIn, AnimatedGradientText } from '../components/ui/animated-text'

const sections = [
  {
    title: 'What we process',
    icon: Eye,
    color: 'from-blue-500 to-indigo-600',
    glow: 'blue',
    items: [
      'Resume content that you upload as a PDF or DOCX file.',
      'Optional job descriptions that you paste for ATS analysis.',
      'Derived text such as extracted keywords, scores, and AI suggestions.',
    ],
  },
  {
    title: 'How your data is used',
    icon: Shield,
    color: 'from-emerald-500 to-teal-600',
    glow: 'emerald',
    items: [
      'Files and text are used only to perform scoring, extraction, rewriting, and preview for your session.',
      'We do not sell your resume data or job descriptions to third parties.',
      'Aggregate, anonymized metrics (for example, feature usage counts) may be used to improve the product.',
    ],
  },
  {
    title: 'Storage & retention',
    icon: Database,
    color: 'from-violet-500 to-purple-600',
    glow: 'violet',
    items: [
      'Uploaded files are stored on the server only as long as needed to run analysis and previews.',
      'Client-side history (recent analyses) is stored in your browser only and can be cleared at any time.',
      'If you refresh or change browsers, server-side state is not carried over.',
    ],
  },
  {
    title: 'Your controls',
    icon: Settings,
    color: 'from-amber-500 to-orange-600',
    glow: 'amber',
    items: [
      'Use the "Remove CV" option on the home page to clear uploaded content from the current session.',
      'Clear your browser storage to remove local history and cached previews.',
      'If this tool is deployed for real users, add a contact address here for data-removal requests.',
    ],
  },
]

export default function Privacy() {
  return (
    <main className="flex-1 relative overflow-hidden">
      <GridPattern className="absolute inset-0 z-0 opacity-30" />

      <div className="relative z-10 mx-auto max-w-3xl px-4 sm:px-6 py-12">
        {/* Hero */}
        <FadeInOnScroll className="mb-10">
          <div className="flex items-center gap-4 mb-4">
            <motion.div
              whileHover={{ rotate: 10, scale: 1.1 }}
              className="h-12 w-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-xl shadow-emerald-500/25"
            >
              <Lock className="h-6 w-6 text-white" />
            </motion.div>
            <Badge variant="default">Privacy</Badge>
          </div>
          <BlurIn>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">
              Privacy &{' '}
              <AnimatedGradientText>data use</AnimatedGradientText>
            </h2>
          </BlurIn>
          <p className="text-slate-500 mt-3 leading-relaxed max-w-xl">
            AI Resume Analyzer is designed to help you improve your resume without turning your personal data into a product.
            This page explains, in plain language, what happens to your CV when you use the tool.
          </p>
        </FadeInOnScroll>

        {/* Privacy sections */}
        <div className="space-y-5">
          {sections.map((section, i) => {
            const Icon = section.icon
            return (
              <FadeInOnScroll key={section.title} delay={i * 0.1}>
                <GlowCard glowColor={section.glow}>
                  <div className="p-6">
                    <div className="flex items-center gap-3 mb-5">
                      <motion.div
                        whileHover={{ rotate: 10, scale: 1.1 }}
                        className={`h-10 w-10 rounded-xl bg-gradient-to-br ${section.color} flex items-center justify-center shadow-lg`}
                      >
                        <Icon className="h-5 w-5 text-white" />
                      </motion.div>
                      <h3 className="text-lg font-bold text-slate-800">{section.title}</h3>
                    </div>
                    <ul className="space-y-3 pl-1">
                      {section.items.map((item, j) => (
                        <motion.li
                          key={j}
                          initial={{ opacity: 0, x: -8 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          viewport={{ once: true }}
                          transition={{ delay: 0.05 * j }}
                          className="flex items-start gap-3"
                        >
                          <span className="mt-2 h-1.5 w-1.5 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 shrink-0" />
                          <span className="text-sm text-slate-600 leading-relaxed">{item}</span>
                        </motion.li>
                      ))}
                    </ul>
                  </div>
                </GlowCard>
              </FadeInOnScroll>
            )
          })}
        </div>
      </div>
    </main>
  )
}
