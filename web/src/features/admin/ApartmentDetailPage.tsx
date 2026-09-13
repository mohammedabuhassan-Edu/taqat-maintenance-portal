import * as React from 'react'
import { Link, useParams } from 'react-router'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, ArrowRight, Pencil, UserPlus } from 'lucide-react'
import { useApartment } from '@/features/apartments/api'
import { useTenantsByApartment } from '@/features/tenants/api'
import { useRequests } from '@/features/requests/api'
import { RequestList } from '@/features/requests/components'
import { useFees, summarize } from '@/features/fees/api'
import { FeeStatusBadge, FeeTable } from '@/features/fees/components'
import { ApartmentDialog } from './ApartmentsPage'
import { InviteTenantDialog } from './TenantsPage'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { EmptyState, ErrorBanner, PageHeader, Spinner, StatCard } from '@/components/ui/misc'
import { NotFound } from '@/components/NotFound'
import { describeError } from '@/lib/errors'
import { cn, formatMoney } from '@/lib/utils'

type Tab = 'tenants' | 'requests' | 'fees'

export function AdminApartmentDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { t, i18n } = useTranslation()
  const apartment = useApartment(id)
  const tenants = useTenantsByApartment(id)
  const requests = useRequests({ apartment_id: id })
  const fees = useFees({ apartment_id: id })
  const [tab, setTab] = React.useState<Tab>('tenants')
  const [editing, setEditing] = React.useState(false)
  const [inviting, setInviting] = React.useState(false)
  const BackIcon = i18n.dir() === 'rtl' ? ArrowRight : ArrowLeft

  if (apartment.isLoading) return <Spinner />
  if (apartment.error) {
    if ((apartment.error as { code?: string }).code === 'PGRST116') return <NotFound />
    return <ErrorBanner message={describeError(apartment.error, t)} onRetry={() => void apartment.refetch()} />
  }
  if (!apartment.data) return <NotFound />
  const a = apartment.data
  const summary = summarize(fees.data ?? [])

  const tabs: { key: Tab; label: string; count?: number }[] = [
    { key: 'tenants', label: t('apartments.tabs.tenants'), count: tenants.data?.length },
    { key: 'requests', label: t('apartments.tabs.requests'), count: requests.data?.length },
    { key: 'fees', label: t('apartments.tabs.fees'), count: fees.data?.length },
  ]

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ms-2">
        <Link to="/admin/apartments">
          <BackIcon />
          {t('apartments.title')}
        </Link>
      </Button>
      <PageHeader
        title={t('apartments.detailTitle', { unit: a.unit_number })}
        description={[a.floor !== null ? `${t('apartments.fields.floor')} ${a.floor}` : null, a.notes].filter(Boolean).join(' · ') || undefined}
        actions={
          <>
            <Button variant="outline" onClick={() => setInviting(true)}>
              <UserPlus />
              {t('apartments.inviteTenant')}
            </Button>
            <Button variant="outline" onClick={() => setEditing(true)}>
              <Pencil />
              {t('common.edit')}
            </Button>
          </>
        }
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label={t('dashboard.openRequests')} value={requests.data?.filter((r) => r.status === 'new' || r.status === 'in_progress').length ?? '—'} />
        <StatCard label={t('fees.outstanding')} value={formatMoney(summary.unpaid, i18n.language)} tone={summary.unpaid > 0 ? 'warning' : 'success'} />
        <StatCard label={t('fees.paidTotal')} value={formatMoney(summary.paid, i18n.language)} />
      </div>

      <div className="flex gap-1 border-b">
        {tabs.map((tb) => (
          <button
            key={tb.key}
            type="button"
            onClick={() => setTab(tb.key)}
            className={cn(
              '-mb-px flex items-center gap-2 border-b-2 px-4 py-2 text-sm font-medium',
              tab === tb.key ? 'border-brand-700 text-brand-800' : 'border-transparent text-slate-500 hover:text-slate-800',
            )}
          >
            {tb.label}
            {tb.count !== undefined ? <Badge variant="muted">{tb.count}</Badge> : null}
          </button>
        ))}
      </div>

      {tab === 'tenants' ? (
        tenants.isLoading ? (
          <Spinner />
        ) : !tenants.data || tenants.data.length === 0 ? (
          <EmptyState title={t('apartments.noTenants')} action={<Button onClick={() => setInviting(true)}>{t('apartments.inviteTenant')}</Button>} />
        ) : (
          <div className="overflow-hidden rounded-xl border bg-white">
            <table className="w-full text-sm">
              <tbody className="divide-y">
                {tenants.data.map((tn) => (
                  <tr key={tn.id}>
                    <td className="px-4 py-3 font-medium">{tn.full_name}</td>
                    <td className="px-4 py-3 text-slate-500" dir="ltr">
                      {tn.email}
                    </td>
                    <td className="px-4 py-3 text-slate-500" dir="ltr">
                      {tn.phone ?? ''}
                    </td>
                    <td className="px-4 py-3 text-end">{tn.is_active ? null : <Badge variant="muted">{t('tenants.inactive')}</Badge>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : tab === 'requests' ? (
        <RequestList requests={requests.data} isLoading={requests.isLoading} error={requests.error} refetch={() => void requests.refetch()} basePath="/admin/requests" />
      ) : fees.isLoading ? (
        <Spinner />
      ) : !fees.data || fees.data.length === 0 ? (
        <EmptyState title={t('fees.empty')} />
      ) : (
        <FeeTable fees={fees.data} renderStatus={(f) => <FeeStatusBadge fee={f} />} />
      )}

      <ApartmentDialog open={editing} onOpenChange={setEditing} apartment={a} />
      <InviteTenantDialog open={inviting} onOpenChange={setInviting} defaultApartmentId={a.id} />
    </div>
  )
}
