import { Link } from 'react-router'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useRequests } from '@/features/requests/api'
import { RequestList } from '@/features/requests/components'
import { Button } from '@/components/ui/button'
import { ErrorBanner, PageHeader, Spinner, StatCard } from '@/components/ui/misc'
import { describeError } from '@/lib/errors'
import { formatMoney } from '@/lib/utils'

function useAdminStats() {
  return useQuery({
    queryKey: ['dashboard', 'admin-stats'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('admin_dashboard_stats')
      if (error) throw error
      return data[0] ?? null
    },
  })
}

export function AdminDashboardPage() {
  const { t, i18n } = useTranslation()
  const stats = useAdminStats()
  const urgent = useRequests({ status: 'open', priority: 'urgent', limit: 5 })
  const recent = useRequests({ limit: 6 })

  return (
    <div>
      <PageHeader title={t('dashboard.title')} />
      {stats.isLoading ? (
        <Spinner />
      ) : stats.error ? (
        <ErrorBanner message={describeError(stats.error, t)} onRetry={() => void stats.refetch()} />
      ) : stats.data ? (
        <div className="mb-8 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
          <StatCard label={t('dashboard.stats.new')} value={stats.data.new_count} tone="brand" />
          <StatCard label={t('dashboard.stats.inProgress')} value={stats.data.in_progress_count} tone="warning" />
          <StatCard label={t('dashboard.stats.done')} value={stats.data.done_count} tone="success" />
          <StatCard label={t('dashboard.stats.urgentOpen')} value={stats.data.urgent_open_count} tone={stats.data.urgent_open_count > 0 ? 'danger' : 'default'} />
          <StatCard label={t('dashboard.stats.unpaidTotal')} value={formatMoney(Number(stats.data.unpaid_total), i18n.language)} hint={t('dashboard.stats.unpaidCount', { count: stats.data.unpaid_count })} tone={stats.data.unpaid_count > 0 ? 'warning' : 'default'} />
          <StatCard label={t('dashboard.stats.tenants')} value={stats.data.tenants_count} hint={`${stats.data.apartments_count} ${t('dashboard.stats.apartments').toLowerCase()}`} />
        </div>
      ) : null}

      <div className="grid gap-8 lg:grid-cols-2">
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">{t('dashboard.urgentRequests')}</h2>
            <Button asChild variant="link" size="sm">
              <Link to="/admin/requests?status=open&priority=urgent">{t('common.viewAll')}</Link>
            </Button>
          </div>
          <RequestList requests={urgent.data} isLoading={urgent.isLoading} error={urgent.error} refetch={() => void urgent.refetch()} basePath="/admin/requests" showApartment />
        </section>
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">{t('dashboard.recentRequests')}</h2>
            <Button asChild variant="link" size="sm">
              <Link to="/admin/requests">{t('common.viewAll')}</Link>
            </Button>
          </div>
          <RequestList requests={recent.data} isLoading={recent.isLoading} error={recent.error} refetch={() => void recent.refetch()} basePath="/admin/requests" showApartment />
        </section>
      </div>
    </div>
  )
}
