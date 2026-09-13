import * as React from 'react'
import { Link } from 'react-router'
import { useTranslation } from 'react-i18next'
import { Plus } from 'lucide-react'
import { useProfile } from '@/features/auth/AuthProvider'
import { useRequests } from '@/features/requests/api'
import { RequestList } from '@/features/requests/components'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/input'
import { PageHeader } from '@/components/ui/misc'
import { REQUEST_STATUSES, type RequestStatus } from '@/lib/database.types'

export function TenantRequestsPage() {
  const { t } = useTranslation()
  const me = useProfile()
  const [status, setStatus] = React.useState<RequestStatus | 'open' | ''>('')
  const requests = useRequests({ status })

  const newButton = me.apartment_id ? (
    <Button asChild>
      <Link to="/app/requests/new">
        <Plus />
        {t('requests.new')}
      </Link>
    </Button>
  ) : null

  return (
    <div>
      <PageHeader title={t('requests.myTitle')} actions={newButton} />
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Select value={status} onChange={(e) => setStatus(e.target.value as RequestStatus | 'open' | '')} className="w-auto" aria-label={t('requests.filterStatus')}>
          <option value="">{t('common.all')}</option>
          <option value="open">{t('requests.openOnly')}</option>
          {REQUEST_STATUSES.map((s) => (
            <option key={s} value={s}>
              {t(`requests.status.${s}`)}
            </option>
          ))}
        </Select>
        {requests.data ? <span className="text-sm text-slate-500">{t('requests.count', { count: requests.data.length })}</span> : null}
      </div>
      <RequestList
        requests={requests.data}
        isLoading={requests.isLoading}
        error={requests.error}
        refetch={() => void requests.refetch()}
        basePath="/app/requests"
        emptyAction={newButton}
      />
    </div>
  )
}
