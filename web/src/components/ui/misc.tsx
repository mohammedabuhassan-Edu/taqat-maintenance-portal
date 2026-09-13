import * as React from 'react'
import { Loader2, Inbox } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'

export function Spinner({ className }: { className?: string }) {
  const { t } = useTranslation()
  return (
    <div role="status" aria-label={t('common.loading')} className={cn('flex justify-center p-8', className)}>
      <Loader2 className="size-6 animate-spin text-brand-700" />
    </div>
  )
}

interface EmptyStateProps {
  title: React.ReactNode
  description?: React.ReactNode
  action?: React.ReactNode
  icon?: React.ReactNode
  className?: string
}

export function EmptyState({ title, description, action, icon, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed p-10 text-center', className)}>
      <div className="text-slate-300">{icon ?? <Inbox className="size-8" />}</div>
      <p className="text-sm font-medium text-slate-700">{title}</p>
      {description ? <p className="max-w-sm text-sm text-slate-500">{description}</p> : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  )
}

interface PageHeaderProps {
  title: React.ReactNode
  description?: React.ReactNode
  actions?: React.ReactNode
}

export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {description ? <p className="mt-1 text-sm text-slate-500">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  )
}

export function ErrorBanner({ message, onRetry }: { message: string; onRetry?: () => void }) {
  const { t } = useTranslation()
  return (
    <div role="alert" className="flex items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
      <span>{message}</span>
      {onRetry ? (
        <button type="button" onClick={onRetry} className="font-medium underline underline-offset-2">
          {t('common.retry')}
        </button>
      ) : null}
    </div>
  )
}

export function StatCard({ label, value, hint, tone = 'default' }: { label: string; value: React.ReactNode; hint?: string; tone?: 'default' | 'brand' | 'warning' | 'danger' | 'success' }) {
  const tones = {
    default: 'text-slate-900',
    brand: 'text-brand-700',
    warning: 'text-amber-700',
    danger: 'text-red-700',
    success: 'text-emerald-700',
  }
  return (
    <div className="rounded-xl border bg-white p-4 shadow-xs">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className={cn('mt-1 text-2xl font-semibold', tones[tone])}>{value}</p>
      {hint ? <p className="mt-0.5 text-xs text-slate-500">{hint}</p> : null}
    </div>
  )
}
