import * as React from 'react'
import { useSearchParams } from 'react-router'
import { useTranslation } from 'react-i18next'
import { Search, X } from 'lucide-react'
import { useRequests, type RequestFilters } from '@/features/requests/api'
import { RequestList } from '@/features/requests/components'
import { useApartments } from '@/features/apartments/api'
import { Button } from '@/components/ui/button'
import { Input, Select } from '@/components/ui/input'
import { PageHeader } from '@/components/ui/misc'
import { REQUEST_CATEGORIES, REQUEST_PRIORITIES, REQUEST_STATUSES } from '@/lib/database.types'

function useDebounced<T>(value: T, ms: number) {
  const [v, setV] = React.useState(value)
  React.useEffect(() => {
    const id = setTimeout(() => setV(value), ms)
    return () => clearTimeout(id)
  }, [value, ms])
  return v
}

export function AdminRequestsPage() {
  const { t } = useTranslation()
  const [params, setParams] = useSearchParams()
  const apartments = useApartments()

  const status = (params.get('status') ?? 'open') as RequestFilters['status']
  const category = (params.get('category') ?? '') as RequestFilters['category']
  const priority = (params.get('priority') ?? '') as RequestFilters['priority']
  const apartment_id = params.get('apartment') ?? ''
  const [search, setSearch] = React.useState(params.get('q') ?? '')
  const debouncedSearch = useDebounced(search, 300)

  const set = (key: string, value: string) => {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value)
    else next.delete(key)
    setParams(next, { replace: true })
  }

  React.useEffect(() => {
    set('q', debouncedSearch)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch])

  const requests = useRequests({ status, category, priority, apartment_id, search: debouncedSearch })
  const hasFilters = status !== 'open' || category || priority || apartment_id || search

  return (
    <div>
      <PageHeader title={t('requests.title')} description={requests.data ? t('requests.count', { count: requests.data.length }) : undefined} />

      <div className="mb-4 grid gap-2 md:grid-cols-[1fr_auto_auto_auto_auto]">
        <div className="relative">
          <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t('requests.searchPlaceholder')} className="ps-9" aria-label={t('common.search')} />
        </div>
        <Select value={status ?? ''} onChange={(e) => set('status', e.target.value)} aria-label={t('requests.filterStatus')}>
          <option value="open">{t('requests.openOnly')}</option>
          <option value="">{t('common.all')}</option>
          {REQUEST_STATUSES.map((s) => (
            <option key={s} value={s}>
              {t(`requests.status.${s}`)}
            </option>
          ))}
        </Select>
        <Select value={category ?? ''} onChange={(e) => set('category', e.target.value)} aria-label={t('requests.filterCategory')}>
          <option value="">{t('requests.filterCategory')}: {t('common.all')}</option>
          {REQUEST_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {t(`requests.category.${c}`)}
            </option>
          ))}
        </Select>
        <Select value={priority ?? ''} onChange={(e) => set('priority', e.target.value)} aria-label={t('requests.filterPriority')}>
          <option value="">{t('requests.filterPriority')}: {t('common.all')}</option>
          {REQUEST_PRIORITIES.map((p) => (
            <option key={p} value={p}>
              {t(`requests.priority.${p}`)}
            </option>
          ))}
        </Select>
        <Select value={apartment_id} onChange={(e) => set('apartment', e.target.value)} aria-label={t('requests.filterApartment')}>
          <option value="">{t('requests.filterApartment')}: {t('common.all')}</option>
          {apartments.data?.map((a) => (
            <option key={a.id} value={a.id}>
              {a.unit_number}
            </option>
          ))}
        </Select>
      </div>
      {hasFilters ? (
        <div className="mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearch('')
              setParams(new URLSearchParams({ status: 'open' }), { replace: true })
            }}
          >
            <X />
            {t('common.clearFilters')}
          </Button>
        </div>
      ) : null}

      <RequestList requests={requests.data} isLoading={requests.isLoading} error={requests.error} refetch={() => void requests.refetch()} basePath="/admin/requests" showApartment />
    </div>
  )
}
