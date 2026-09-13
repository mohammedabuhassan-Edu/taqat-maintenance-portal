import * as React from 'react'
import { Link, useParams } from 'react-router'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { toast } from 'sonner'
import { useRequest, useUpdateRequest } from '@/features/requests/api'
import { CommentThread, PhotoGrid, PriorityBadge, StatusBadge, Timeline } from '@/features/requests/components'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ConfirmDialog } from '@/components/ui/dialog'
import { ErrorBanner, Spinner } from '@/components/ui/misc'
import { describeError } from '@/lib/errors'
import { formatDate } from '@/lib/utils'
import { NotFound } from '@/components/NotFound'

export function TenantRequestDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { t, i18n } = useTranslation()
  const { data: request, isLoading, error, refetch } = useRequest(id)
  const update = useUpdateRequest()
  const [confirmCancel, setConfirmCancel] = React.useState(false)
  const BackIcon = i18n.dir() === 'rtl' ? ArrowRight : ArrowLeft

  if (isLoading) return <Spinner />
  if (error) {
    const code = (error as { code?: string }).code
    if (code === 'PGRST116') return <NotFound />
    return <ErrorBanner message={describeError(error, t)} onRetry={() => void refetch()} />
  }
  if (!request) return <NotFound />

  const cancel = async () => {
    try {
      await update.mutateAsync({ id: request.id, status: 'cancelled' })
      toast.success(t('requests.cancelled'))
      setConfirmCancel(false)
    } catch (e) {
      toast.error(describeError(e, t))
    }
  }

  const closed = request.status === 'done' || request.status === 'cancelled'

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ms-2">
        <Link to="/app/requests">
          <BackIcon />
          {t('requests.myTitle')}
        </Link>
      </Button>

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
          {request.status === 'new' ? (
            <div className="flex justify-end">
              <Button variant="outline" onClick={() => setConfirmCancel(true)}>
                {t('requests.cancelRequest')}
              </Button>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-5">
          <CommentThread requestId={request.id} disabled={closed} />
        </CardContent>
      </Card>

      <ConfirmDialog
        open={confirmCancel}
        onOpenChange={setConfirmCancel}
        title={t('requests.cancelRequest')}
        description={t('requests.cancelConfirm')}
        confirmLabel={t('requests.cancelRequest')}
        destructive
        loading={update.isPending}
        onConfirm={() => void cancel()}
      />
    </div>
  )
}
