import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-slate-100 text-slate-700',
        info: 'border-transparent bg-blue-50 text-blue-700',
        warning: 'border-transparent bg-amber-50 text-amber-800',
        success: 'border-transparent bg-emerald-50 text-emerald-700',
        danger: 'border-transparent bg-red-50 text-red-700',
        muted: 'border-transparent bg-slate-50 text-slate-500',
        brand: 'border-transparent bg-brand-50 text-brand-800',
        outline: 'text-slate-700',
      },
    },
    defaultVariants: { variant: 'default' },
  },
)

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />
}
