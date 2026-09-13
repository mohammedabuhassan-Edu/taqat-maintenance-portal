import * as React from 'react'
import { Link } from 'react-router'
import { useTranslation } from 'react-i18next'
import { useForm } from 'react-hook-form'
import { ImageOff, MessageSquare } from 'lucide-react'
import { toast } from 'sonner'
import { Badge, type BadgeProps } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/input'
import { EmptyState, Spinner, ErrorBanner } from '@/components/ui/misc'
import { cn, formatDate } from '@/lib/utils'
import { describeError } from '@/lib/errors'
import type { RequestPriority, RequestStatus } from '@/lib/database.types'
import { useAddComment, useComments, usePhotos, type RequestRow } from './api'
import { useProfile } from '@/features/auth/AuthProvider'

const statusVariant: Record<RequestStatus, BadgeProps['variant']> = {
  new: 'info',
  in_progress: 'warning',
  done: 'success',
  cancelled: 'muted',
}

const priorityVariant: Record<RequestPriority, BadgeProps['variant']> = {
  low: 'muted',
  normal: 'default',
  urgent: 'danger',
}

export function StatusBadge({ status }: { status: RequestStatus }) {
  const { t } = useTranslation()
  return <Badge variant={statusVariant[status]}>{t(`requests.status.${status}`)}</Badge>
}

export function PriorityBadge({ priority }: { priority: RequestPriority }) {
  const { t } = useTranslation()
  return <Badge variant={priorityVariant[priority]}>{t(`requests.priority.${priority}`)}</Badge>
}

export function RequestListItem({ request, to, showApartment }: { request: RequestRow; to: string; showApartment?: boolean }) {
  const { t, i18n } = useTranslation()
  return (
    <Link
      to={to}
      className="flex items-start justify-between gap-4 rounded-xl border bg-white p-4 shadow-xs transition-colors hover:border-brand-300 hover:bg-brand-50/30"
    >
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate font-medium">{request.title}</p>
          {request.priority === 'urgent' ? <PriorityBadge priority="urgent" /> : null}
        </div>
        <p className="mt-1 line-clamp-1 text-sm text-slate-500">{request.description}</p>
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
          <span>{t(`requests.category.${request.category}`)}</span>
          {showApartment && request.apartments ? <span>· {t('dashboard.apartment', { unit: request.apartments.unit_number })}</span> : null}
          <span>· {formatDate(request.created_at, i18n.language)}</span>
        </div>
      </div>
      <StatusBadge status={request.status} />
    </Link>
  )
}

export function RequestList({
  requests,
  isLoading,
  error,
  refetch,
  basePath,
  showApartment,
  emptyAction,
}: {
  requests: RequestRow[] | undefined
  isLoading: boolean
  error: unknown
  refetch: () => void
  basePath: string
  showApartment?: boolean
  emptyAction?: React.ReactNode
}) {
  const { t } = useTranslation()
  if (isLoading) return <Spinner />
  if (error) return <ErrorBanner message={describeError(error, t)} onRetry={refetch} />
  if (!requests || requests.length === 0) return <EmptyState title={t('requests.noRequests')} action={emptyAction} />
  return (
    <div className="space-y-2">
      {requests.map((r) => (
        <RequestListItem key={r.id} request={r} to={`${basePath}/${r.id}`} showApartment={showApartment} />
      ))}
    </div>
  )
}

export function PhotoGrid({ requestId }: { requestId: string }) {
  const { t } = useTranslation()
  const { data, isLoading, error } = usePhotos(requestId)
  if (isLoading) return <Spinner className="p-4" />
  if (error) return <ErrorBanner message={describeError(error, t)} />
  if (!data || data.length === 0) return null
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
      {data.map((p) =>
        p.url ? (
          <a key={p.id} href={p.url} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-lg border bg-slate-100">
            <img src={p.url} alt="" loading="lazy" className="aspect-square w-full object-cover transition-transform hover:scale-105" />
          </a>
        ) : (
          <div key={p.id} className="flex aspect-square items-center justify-center rounded-lg border bg-slate-50 text-slate-300">
            <ImageOff />
          </div>
        ),
      )}
    </div>
  )
}

export function CommentThread({ requestId, disabled }: { requestId: string; disabled?: boolean }) {
  const { t, i18n } = useTranslation()
  const me = useProfile()
  const { data, isLoading, error, refetch } = useComments(requestId)
  const add = useAddComment(requestId)
  const form = useForm<{ body: string }>({ defaultValues: { body: '' } })

  const onSubmit = form.handleSubmit(async ({ body }) => {
    const text = body.trim()
    if (!text) return
    try {
      await add.mutateAsync({ body: text.slice(0, 1000), author_id: me.id })
      form.reset()
    } catch (e) {
      toast.error(describeError(e, t))
    }
  })

  return (
    <section className="space-y-4">
      <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-700">
        <MessageSquare className="size-4" />
        {t('requests.comments')}
        {data ? <span className="text-slate-400">({data.length})</span> : null}
      </h2>
      {isLoading ? (
        <Spinner className="p-4" />
      ) : error ? (
        <ErrorBanner message={describeError(error, t)} onRetry={refetch} />
      ) : data && data.length > 0 ? (
        <ul className="space-y-3">
          {data.map((c) => {
            const mine = c.author_id === me.id
            const isAdmin = c.author?.role === 'admin'
            return (
              <li key={c.id} className={cn('flex', mine ? 'justify-end' : 'justify-start')}>
                <div
                  className={cn(
                    'max-w-[85%] rounded-2xl px-4 py-2.5 text-sm shadow-xs',
                    mine ? 'bg-brand-700 text-white' : isAdmin ? 'bg-amber-50 text-slate-900' : 'bg-white border',
                  )}
                >
                  <div className={cn('mb-0.5 flex items-center gap-2 text-[11px]', mine ? 'text-brand-100' : 'text-slate-500')}>
                    <span className="font-medium">{mine ? t('common.you') : c.author?.full_name ?? t('common.admin')}</span>
                    {isAdmin && !mine ? <Badge variant="warning" className="px-1.5 py-0 text-[10px]">{t('common.admin')}</Badge> : null}
                    <span>· {formatDate(c.created_at, i18n.language, true)}</span>
                  </div>
                  <p className="whitespace-pre-wrap break-words">{c.body}</p>
                </div>
              </li>
            )
          })}
        </ul>
      ) : (
        <p className="text-sm text-slate-500">{t('requests.noComments')}</p>
      )}
      {!disabled ? (
        <form onSubmit={onSubmit} className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <Textarea
            {...form.register('body')}
            placeholder={t('requests.commentPlaceholder')}
            maxLength={1000}
            className="min-h-16 flex-1"
            aria-label={t('requests.comments')}
          />
          <Button type="submit" loading={add.isPending} className="sm:w-auto">
            {t('requests.postComment')}
          </Button>
        </form>
      ) : null}
    </section>
  )
}

export function Timeline({ request }: { request: RequestRow }) {
  const { t, i18n } = useTranslation()
  const steps: { key: RequestStatus; at: string | null }[] = [
    { key: 'new', at: request.created_at },
    { key: 'in_progress', at: request.status === 'in_progress' || request.status === 'done' ? request.updated_at : null },
    { key: 'done', at: request.resolved_at },
  ]
  if (request.status === 'cancelled') {
    return (
      <div className="flex items-center gap-3 text-sm text-slate-500">
        <StatusBadge status="cancelled" />
        <span>{formatDate(request.updated_at, i18n.language, true)}</span>
      </div>
    )
  }
  const reachedIndex = request.status === 'new' ? 0 : request.status === 'in_progress' ? 1 : 2
  return (
    <ol className="flex items-center gap-2 text-xs">
      {steps.map((s, i) => {
        const reached = i <= reachedIndex
        return (
          <React.Fragment key={s.key}>
            {i > 0 ? <span className={cn('h-px flex-1', reached ? 'bg-brand-600' : 'bg-slate-200')} /> : null}
            <li className="flex flex-col items-center gap-1 text-center">
              <span className={cn('size-3 rounded-full', reached ? 'bg-brand-600' : 'bg-slate-200')} />
              <span className={cn('font-medium', reached ? 'text-slate-800' : 'text-slate-400')}>{t(`requests.status.${s.key}`)}</span>
              {reached && s.at ? <span className="text-slate-400">{formatDate(s.at, i18n.language)}</span> : null}
            </li>
          </React.Fragment>
        )
      })}
    </ol>
  )
}
