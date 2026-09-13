import * as React from 'react'
import { Link, useParams } from 'react-router'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { toast } from 'sonner'
import { useRequest, useUpdateRequest, useAdminNote, useSaveAdminNote } from '@/features/requests/api'
import { CommentThread, PhotoGrid, PriorityBadge, StatusBadge, Timeline } from '@/features/requests/components'
import { useProfile } from '@/features/auth/AuthProvider'
import { Button } from '@/components/ui/button'
import { Select, Textarea } from '@/components/ui/input'
import { Field } from '@/components/ui/field'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ErrorBanner, Spinner } from '@/components/ui/misc'
import { describeError } from '@/lib/errors'
import { formatDate } from '@/lib/utils'
import { NotFound } from '@/components/NotFound'
import { REQUEST_PRIORITIES, REQUEST_STATUSES, type RequestPriority, type RequestStatus } from '@/lib/database.types'

export function AdminRequestDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { t, i18n } = useTranslation()
  const me = useProfile()
  const { data: request, isLoading, error, refetch } = useRequest(id)
  const update = useUpdateRequest()
  const savedNote = useAdminNote(id)
  const saveNote = useSaveAdminNote(id ?? '')
  const [notes, setNotes] = React.useState<string | null>(null)
  const BackIcon = i18n.dir() === 'rtl' ? ArrowRight : ArrowLeft

  if (isLoading) return <Spinner />
  if (error) {
    if ((error as { code?: string }).code === 'PGRST116') return <NotFound />
    return <ErrorBanner message={describeError(error, t)} onRetry={() => void refetch()} />
  }
  if (!request) return <NotFound />

  const currentNotes = notes ?? savedNote.data ?? ''
  const notesDirty = currentNotes !== (savedNote.data ?? '')

  const patch = async (p: Parameters<typeof update.mutateAsync>[0], successKey: string) => {
    try {
      await update.mutateAsync(p)
      toast.success(t(successKey))
    } catch (e) {
      toast.error(describeError(e, t))
    }
  }

  const persistNotes = async () => {
    try {
      await saveNote.mutateAsync({ body: currentNotes.trim(), updated_by: me.id })
      setNotes(null)
      toast.success(t('requests.notesSaved'))
    } catch (e) {
      toast.error(describeError(e, t))
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ms-2">
        <Link to="/admin/requests">
          <BackIcon />
          {t('requests.title')}
        </Link>
      </Button>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <CardTitle className="text-xl">{request.title}</CardTitle>
                  <p className="mt-1 text-sm text-slate-500">
                    {t(`requests.category.${request.category}`)} · {formatDate(request.created_at, i18n.language, true)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <PriorityBadge priority={request.priority} />
                  <StatusBadge status={request.status} />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <Timeline request={request} />
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-800">{request.description}</p>
              <PhotoGrid requestId={request.id} />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-5">
              <CommentThread requestId={request.id} />
            </CardContent>
          </Card>
        </div>

        <aside className="space-y-6">
          <Card>
            <CardContent className="space-y-4 pt-5">
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between gap-2">
                  <dt className="text-slate-500">{t('requests.fields.apartment')}</dt>
                  <dd className="font-medium">
                    {request.apartments ? (
                      <Link to={`/admin/apartments/${request.apartment_id}`} className="text-brand-700 hover:underline">
                        {request.apartments.unit_number}
                      </Link>
                    ) : (
                      t('common.notAvailable')
                    )}
                  </dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-slate-500">{t('requests.fields.submittedBy')}</dt>
                  <dd className="font-medium">{request.creator?.full_name ?? t('common.notAvailable')}</dd>
                </div>
                {request.resolved_at ? (
                  <div className="flex justify-between gap-2">
                    <dt className="text-slate-500">{t('requests.fields.resolvedAt')}</dt>
                    <dd className="font-medium">{formatDate(request.resolved_at, i18n.language)}</dd>
                  </div>
                ) : null}
              </dl>

              <Field label={t('requests.fields.status')} htmlFor="status">
                <Select
                  id="status"
                  value={request.status}
                  disabled={update.isPending}
                  onChange={(e) => void patch({ id: request.id, status: e.target.value as RequestStatus }, 'requests.statusUpdated')}
                >
                  {REQUEST_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {t(`requests.status.${s}`)}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label={t('requests.fields.priority')} htmlFor="priority">
                <Select
                  id="priority"
                  value={request.priority}
                  disabled={update.isPending}
                  onChange={(e) => void patch({ id: request.id, priority: e.target.value as RequestPriority }, 'requests.statusUpdated')}
                >
                  {REQUEST_PRIORITIES.map((p) => (
                    <option key={p} value={p}>
                      {t(`requests.priority.${p}`)}
                    </option>
                  ))}
                </Select>
              </Field>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-3 pt-5">
              <Field label={t('requests.fields.adminNotes')} htmlFor="admin_notes" hint={t('requests.fields.adminNotesHint')}>
                <Textarea id="admin_notes" value={currentNotes} onChange={(e) => setNotes(e.target.value)} rows={5} maxLength={2000} disabled={savedNote.isLoading} />
              </Field>
              <div className="flex justify-end">
                <Button size="sm" disabled={!notesDirty} loading={saveNote.isPending} onClick={() => void persistNotes()}>
                  {t('common.save')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  )
}
