import * as React from 'react'
import * as LabelPrimitive from '@radix-ui/react-label'
import { cn } from '@/lib/utils'

export function Label({ className, ...props }: React.ComponentProps<typeof LabelPrimitive.Root>) {
  return (
    <LabelPrimitive.Root
      className={cn('text-sm font-medium leading-none text-slate-800', className)}
      {...props}
    />
  )
}

interface FieldProps {
  label: React.ReactNode
  htmlFor: string
  error?: string
  hint?: React.ReactNode
  optional?: string
  children: React.ReactNode
  className?: string
}

/** Label + control + hint/error wrapper with consistent spacing. */
export function Field({ label, htmlFor, error, hint, optional, children, className }: FieldProps) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <div className="flex items-baseline justify-between">
        <Label htmlFor={htmlFor}>{label}</Label>
        {optional ? <span className="text-xs text-slate-400">{optional}</span> : null}
      </div>
      {children}
      {error ? (
        <p role="alert" className="text-xs text-red-600">
          {error}
        </p>
      ) : hint ? (
        <p className="text-xs text-slate-500">{hint}</p>
      ) : null}
    </div>
  )
}
