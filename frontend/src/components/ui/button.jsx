import { forwardRef } from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-pointer',
  {
    variants: {
      variant: {
        default: 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:brightness-110 focus-visible:ring-emerald-500',
        secondary: 'bg-white/80 text-slate-700 border border-slate-200/80 shadow-sm hover:bg-white hover:border-slate-300 hover:shadow-md backdrop-blur-sm focus-visible:ring-slate-400',
        ghost: 'text-slate-500 hover:text-slate-700 hover:bg-slate-100/60',
        destructive: 'bg-red-500/90 text-white shadow-sm hover:bg-red-600 focus-visible:ring-red-500',
        outline: 'border border-slate-200 bg-transparent hover:bg-slate-50 text-slate-700 focus-visible:ring-slate-400',
      },
      size: {
        default: 'h-10 px-5 py-2',
        sm: 'h-8 px-3 text-xs',
        lg: 'h-12 px-8 text-base',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

const Button = forwardRef(({ className, variant, size, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : 'button'
  return (
    <Comp
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      {...props}
    />
  )
})
Button.displayName = 'Button'

export { Button, buttonVariants }
