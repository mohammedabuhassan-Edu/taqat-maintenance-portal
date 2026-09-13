import { useTranslation } from 'react-i18next'
import { useProfile } from '@/features/auth/AuthProvider'
import { useFees, summarize } from '@/features/fees/api'
import { FeeStatusBadge, FeeTable } from '@/features/fees/components'
import { EmptyState, ErrorBanner, PageHeader, Spinner, StatCard } from '@/components/ui/misc'
import { describeError } from '@/lib/errors'
import { formatMoney } from '@/lib/utils'

export function TenantFeesPage() {
  const { t, i18n } = useTranslation()
  const me = useProfile()
  const { data, isLoading, error, refetch } = useFees({ apartment_id: me.apartment_id ?? undefined })
  const summary = summarize(data ?? [])

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader title={t('fees.myTitle')} />
      <div className="mb-6 grid gap-3 sm:grid-cols-2">
        <StatCard label={t('fees.outstanding')} value={formatMoney(summary.unpaid, i18n.language)} tone={summary.unpaid > 0 ? 'warning' : 'success'} hint={summary.unpaidCount > 0 ? t('dashboard.unpaidFees', { count: summary.unpaidCount }) : t('dashboard.allPaid')} />
        <StatCard label={t('fees.paidTotal')} value={formatMoney(summary.paid, i18n.language)} />
      </div>
      {isLoading ? (
        <Spinner />
      ) : error ? (
        <ErrorBanner message={describeError(error, t)} onRetry={() => void refetch()} />
      ) : !data || data.length === 0 ? (
        <EmptyState title={t('fees.empty')} />
      ) : (
        <FeeTable fees={data} renderStatus={(f) => <FeeStatusBadge fee={f} />} />
      )}
    </div>
  )
}
