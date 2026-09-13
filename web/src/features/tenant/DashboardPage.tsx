import { Link } from 'react-router'
import { useTranslation } from 'react-i18next'
import { Plus, Megaphone } from 'lucide-react'
import { useProfile } from '@/features/auth/AuthProvider'
import { useRequests } from '@/features/requests/api'
import { RequestList } from '@/features/requests/components'
import { useAnnouncements } from '@/features/announcements/api'
import { useFees, summarize } from '@/features/fees/api'
import { useApartment } from '@/features/apartments/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PageHeader, Spinner } from '@/components/ui/misc'
import { Badge } from '@/components/ui/badge'
import { formatDate, formatMoney } from '@/lib/utils'

export function TenantDashboardPage() {
  const { t, i18n } = useTranslation()
  const me = useProfile()
  const apartment = useApartment(me.apartment_id ?? undefined)
  const requests = useRequests({ status: 'open', limit: 5 })
  const announcements = useAnnouncements(3)
  const fees = useFees({ apartment_id: me.apartment_id ?? undefined })
  const summary = summarize(fees.data ?? [])

  return (
    <div>
      <PageHeader
        title={t('dashboard.greeting', { name: me.full_name.split(' ')[0] })}
        description={
          me.apartment_id
            ? apartment.data
              ? t('dashboard.apartment', { unit: apartment.data.unit_number })
              : undefined
            : t('dashboard.noApartment')
        }
        actions={
          me.apartment_id ? (
            <Button asChild>
              <Link to="/app/requests/new">
                <Plus />
                {t('requests.new')}
              </Link>
            </Button>
          ) : null
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">{t('dashboard.openRequests')}</h2>
            <Button asChild variant="link" size="sm">
              <Link to="/app/requests">{t('common.viewAll')}</Link>
            </Button>
          </div>
          <RequestList
            requests={requests.data}
            isLoading={requests.isLoading}
            error={requests.error}
            refetch={() => void requests.refetch()}
            basePath="/app/requests"
          />
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('dashboard.outstandingBalance')}</CardTitle>
            </CardHeader>
            <CardContent>
              {fees.isLoading ? (
                <Spinner className="p-2" />
              ) : (
                <>
                  <p className={summary.unpaid > 0 ? 'text-3xl font-semibold text-amber-700' : 'text-3xl font-semibold text-emerald-700'}>
                    {formatMoney(summary.unpaid, i18n.language)}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    {summary.unpaidCount > 0 ? t('dashboard.unpaidFees', { count: summary.unpaidCount }) : t('dashboard.allPaid')}
                  </p>
                  <Button asChild variant="outline" size="sm" className="mt-3">
                    <Link to="/app/fees">{t('common.viewAll')}</Link>
                  </Button>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Megaphone className="size-4 text-brand-700" />
                {t('dashboard.latestAnnouncements')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {announcements.isLoading ? (
                <Spinner className="p-2" />
              ) : announcements.data && announcements.data.length > 0 ? (
                announcements.data.map((a) => (
                  <Link key={a.id} to="/app/announcements" className="block rounded-lg border p-3 hover:bg-slate-50">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-medium">{a.title}</p>
                      {a.pinned ? <Badge variant="brand">{t('announcements.pinned')}</Badge> : null}
                    </div>
                    <p className="mt-1 line-clamp-2 text-xs text-slate-500">{a.body}</p>
                    <p className="mt-1 text-[11px] text-slate-400">{formatDate(a.published_at, i18n.language)}</p>
                  </Link>
                ))
              ) : (
                <p className="text-sm text-slate-500">{t('dashboard.noAnnouncements')}</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
