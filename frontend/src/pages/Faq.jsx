import { motion } from 'framer-motion'
import {
  FileText, Shield, BarChart3, FileQuestion, Sparkles, Tag,
  AlertTriangle, Clock, Users, CreditCard, HelpCircle,
} from 'lucide-react'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../components/ui/accordion'
import { Badge } from '../components/ui/badge'
import { GlowCard } from '../components/ui/glow-card'
import { GridPattern } from '../components/ui/grid-pattern'
import { FadeInOnScroll, BlurIn, AnimatedGradientText } from '../components/ui/animated-text'

const faqs = [
  { q: 'What formats can I upload?', a: 'We support .pdf and .docx files. For best results, upload a text-based PDF (not a scanned image).', icon: FileText },
  { q: 'Is my data safe?', a: 'Yes. Your resume is processed securely on our server and not shared with third parties. Uploaded files are deleted on a rolling basis. Contact us if you need immediate removal.', icon: Shield },
  { q: 'What does ATS analysis include?', a: 'We score ATS match, highlight matched and missing keywords, and provide a machine-learning assessment to estimate recruiter fit.', icon: BarChart3 },
  { q: 'Do I need a job description?', a: 'It is optional for upload preview and AI suggestions, but required for the full ATS analysis so we can compare against the role.', icon: FileQuestion },
  { q: 'What are AI Suggestions and Rewrites?', a: 'AI Suggestions provide actionable improvements specific to your resume and the target job. Rewrite Bullets uses AI to rephrase selected lines to be clearer and more impactful.', icon: Sparkles },
  { q: 'Can you extract entities (NER)?', a: 'Yes. The Extract NER tool pulls entities like skills, organizations, locations and dates to help you verify parsing quality.', icon: Tag },
  { q: 'Why is my score low?', a: 'Common reasons are missing core keywords from the job posting, vague bullet points, or formatting that hides content. Use the missing keywords list and the AI Rewrite tool to improve quickly.', icon: AlertTriangle },
  { q: 'How long does it take?', a: 'Upload preview is usually under 2 seconds. Full ATS analysis may take 5-15 seconds depending on file size and server load.', icon: Clock },
  { q: 'Does this replace a human review?', a: 'No. Our tools accelerate editing and improve ATS compatibility, but we still recommend getting feedback from a human mentor or recruiter.', icon: Users },
  { q: 'Is there a free version?', a: 'Yes. You can upload and preview for free. Some advanced AI features may require a paid plan; see the Pricing page for details.', icon: CreditCard },
]

export default function Faq() {
  return (
    <main className="flex-1 relative overflow-hidden">
      <GridPattern className="absolute inset-0 z-0 opacity-30" />

      <div className="relative z-10 mx-auto max-w-3xl px-4 sm:px-6 py-12">
        {/* Hero heading */}
        <FadeInOnScroll className="text-center mb-12">
          <motion.div
            whileHover={{ rotate: 10, scale: 1.1 }}
            className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-xl shadow-emerald-500/25 mb-5"
          >
            <HelpCircle className="h-7 w-7 text-white" />
          </motion.div>
          <div>
            <Badge variant="default" className="mb-4">FAQ</Badge>
          </div>
          <BlurIn>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">
              Frequently Asked{' '}
              <AnimatedGradientText>Questions</AnimatedGradientText>
            </h2>
          </BlurIn>
          <p className="text-slate-500 mt-3 max-w-lg mx-auto leading-relaxed">
            Everything you need to know about using AI Resume Analyzer
          </p>
        </FadeInOnScroll>

        {/* FAQ accordion */}
        <FadeInOnScroll delay={0.15}>
          <GlowCard glowColor="emerald">
            <div className="p-3 sm:p-5">
              <Accordion type="single" collapsible className="w-full">
                {faqs.map((faq, i) => {
                  const Icon = faq.icon
                  return (
                    <AccordionItem key={i} value={`item-${i}`}>
                      <AccordionTrigger className="text-left">
                        <span className="flex items-center gap-3">
                          <motion.span
                            whileHover={{ scale: 1.1, rotate: 5 }}
                            className="h-9 w-9 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100/50 flex items-center justify-center shrink-0"
                          >
                            <Icon className="h-4 w-4 text-emerald-600" />
                          </motion.span>
                          <span className="text-slate-700 font-medium">{faq.q}</span>
                        </span>
                      </AccordionTrigger>
                      <AccordionContent className="pl-12 text-slate-500 leading-relaxed">
                        {faq.a}
                      </AccordionContent>
                    </AccordionItem>
                  )
                })}
              </Accordion>
            </div>
          </GlowCard>
        </FadeInOnScroll>
      </div>
    </main>
  )
}
