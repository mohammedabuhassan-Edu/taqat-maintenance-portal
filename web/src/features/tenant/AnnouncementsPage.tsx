import { useTranslation } from 'react-i18next'
import { Pin } from 'lucide-react'
import { useAnnouncements } from '@/features/announcements/api'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { EmptyState, ErrorBanner, PageHeader, Spinner } from '@/components/ui/misc'
import { describeError } from '@/lib/errors'
import { formatDate } from '@/lib/utils'

export function TenantAnnouncementsPage() {
  const { t, i18n } = useTranslation()
  const { data, isLoading, error, refetch } = useAnnouncements()

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title={t('announcements.title')} />
      {isLoading ? (
        <Spinner />
      ) : error ? (
        <ErrorBanner message={describeError(error, t)} onRetry={() => void refetch()} />
      ) : !data || data.length === 0 ? (
        <EmptyState title={t('announcements.empty')} />
      ) : (
        <div className="space-y-3">
          {data.map((a) => (
            <Card key={a.id} className={a.pinned ? 'border-brand-200 bg-brand-50/30' : undefined}>
              <CardContent className="pt-5">
                <div className="flex items-start justify-between gap-3">
                  <h2 className="font-semibold">{a.title}</h2>
                  {a.pinned ? (
                    <Badge variant="brand" className="gap-1">
                      <Pin className="size-3" />
                      {t('announcements.pinned')}
                    </Badge>
                  ) : null}
                </div>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">{a.body}</p>
                <p className="mt-3 text-xs text-slate-400">{t('announcements.published', { date: formatDate(a.published_at, i18n.language) })}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
