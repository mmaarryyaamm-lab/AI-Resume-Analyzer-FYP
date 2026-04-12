import { motion } from 'framer-motion'
import { Check, Sparkles, Zap, CreditCard } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { SpotlightCard } from '../components/ui/spotlight-card'
import { GridPattern } from '../components/ui/grid-pattern'
import { FadeInOnScroll, BlurIn, AnimatedGradientText } from '../components/ui/animated-text'
import { cn } from '@/lib/utils'

const plans = [
  {
    name: 'Free',
    price: '$0',
    period: 'forever',
    description: 'Perfect for trying out the tool',
    icon: Zap,
    color: 'from-slate-400 to-slate-500',
    shadowColor: 'shadow-slate-400/20',
    features: ['3 checks per day', 'Upload & preview', 'Basic ATS scoring', 'Entity extraction'],
    cta: 'Get started',
    featured: false,
  },
  {
    name: 'Pro',
    price: '$19',
    period: '/month',
    description: 'For serious job seekers',
    icon: Sparkles,
    color: 'from-emerald-500 to-teal-600',
    shadowColor: 'shadow-emerald-500/20',
    features: ['Unlimited checks', 'AI-powered bullet rewrites', 'Smart section rewriting', 'Priority processing', 'Export to PDF & DOCX', 'Analysis history'],
    cta: 'Upgrade to Pro',
    featured: true,
  },
]

export default function Pricing() {
  return (
    <main className="flex-1 relative overflow-hidden">
      <GridPattern className="absolute inset-0 z-0 opacity-30" />

      <div className="relative z-10 mx-auto max-w-4xl px-4 sm:px-6 py-12">
        {/* Hero */}
        <FadeInOnScroll className="text-center mb-14">
          <motion.div
            whileHover={{ rotate: 10, scale: 1.1 }}
            className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-xl shadow-emerald-500/25 mb-5"
          >
            <CreditCard className="h-7 w-7 text-white" />
          </motion.div>
          <div>
            <Badge variant="default" className="mb-4">Pricing</Badge>
          </div>
          <BlurIn>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">
              Simple,{' '}
              <AnimatedGradientText>transparent</AnimatedGradientText>{' '}
              pricing
            </h2>
          </BlurIn>
          <p className="text-slate-500 mt-3 max-w-lg mx-auto">Start free, upgrade when you need more power.</p>
        </FadeInOnScroll>

        {/* Plans */}
        <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
          {plans.map((plan, i) => {
            const Icon = plan.icon
            return (
              <FadeInOnScroll key={plan.name} delay={i * 0.12}>
                <SpotlightCard
                  className={cn(
                    'h-full relative overflow-hidden p-0',
                    plan.featured && 'ring-2 ring-emerald-500/20',
                  )}
                >
                  {plan.featured && (
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500" />
                  )}
                  <div className="p-6 text-center">
                    <motion.div
                      whileHover={{ rotate: 10, scale: 1.1 }}
                      className={`h-14 w-14 mx-auto rounded-2xl bg-gradient-to-br ${plan.color} flex items-center justify-center shadow-xl ${plan.shadowColor} mb-4`}
                    >
                      <Icon className="h-7 w-7 text-white" />
                    </motion.div>
                    <Badge variant={plan.featured ? 'default' : 'secondary'} className="mb-3">{plan.name}</Badge>
                    <div className="flex items-baseline justify-center gap-1 mb-1">
                      <span className="text-5xl font-extrabold text-slate-900">{plan.price}</span>
                      <span className="text-sm text-slate-400">{plan.period}</span>
                    </div>
                    <p className="text-sm text-slate-500">{plan.description}</p>
                  </div>
                  <div className="px-6 pb-6 space-y-5">
                    <ul className="space-y-3">
                      {plan.features.map((f) => (
                        <li key={f} className="flex items-center gap-2.5 text-sm text-slate-600">
                          <Check className={cn('h-4 w-4 shrink-0', plan.featured ? 'text-emerald-500' : 'text-slate-400')} />
                          {f}
                        </li>
                      ))}
                    </ul>
                    <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                      <Button className="w-full" variant={plan.featured ? 'default' : 'secondary'}>
                        {plan.cta}
                      </Button>
                    </motion.div>
                  </div>
                </SpotlightCard>
              </FadeInOnScroll>
            )
          })}
        </div>
      </div>
    </main>
  )
}
