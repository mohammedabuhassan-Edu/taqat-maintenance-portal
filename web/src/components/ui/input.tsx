import * as React from 'react'
import { cn } from '@/lib/utils'

export const inputClass =
  'flex h-10 w-full rounded-lg border bg-white px-3 py-2 text-sm shadow-xs placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-red-500'

export function Input({ className, type = 'text', ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input type={type} className={cn(inputClass, className)} {...props} />
}

export function Textarea({ className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(inputClass, 'min-h-24 h-auto resize-y', className)} {...props} />
}

export function Select({ className, children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cn(inputClass, 'cursor-pointer appearance-auto pe-8', className)} {...props}>
      {children}
    </select>
  )
}

export function Checkbox({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      type="checkbox"
      className={cn('size-4 rounded border accent-brand-700 focus-visible:ring-2 focus-visible:ring-brand-500', className)}
      {...props}
    />
  )
}
