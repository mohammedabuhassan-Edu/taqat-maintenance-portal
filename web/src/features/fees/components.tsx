import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { Badge } from '@/components/ui/badge'
import { formatDate, formatMoney } from '@/lib/utils'
import type { FeeRow } from './api'

export function FeeStatusBadge({ fee }: { fee: Pick<FeeRow, 'status' | 'due_date'> }) {
  const { t } = useTranslation()
  if (fee.status === 'paid') return <Badge variant="success">{t('fees.status.paid')}</Badge>
  const overdue = new Date(fee.due_date) < new Date(new Date().toDateString())
  return <Badge variant={overdue ? 'danger' : 'warning'}>{overdue ? t('fees.overdue') : t('fees.status.unpaid')}</Badge>
}

interface FeeTableProps {
  fees: FeeRow[]
  showApartment?: boolean
  renderStatus: (fee: FeeRow) => React.ReactNode
  renderActions?: (fee: FeeRow) => React.ReactNode
}

export function FeeTable({ fees, showApartment, renderStatus, renderActions }: FeeTableProps) {
  const { t, i18n } = useTranslation()
  return (
    <div className="overflow-x-auto rounded-xl border bg-white shadow-xs">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-start text-xs uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-4 py-3 text-start font-medium">{t('fees.fields.title')}</th>
            {showApartment ? <th className="px-4 py-3 text-start font-medium">{t('fees.fields.apartment')}</th> : null}
            <th className="px-4 py-3 text-start font-medium">{t('fees.fields.dueDate')}</th>
            <th className="px-4 py-3 text-end font-medium">{t('fees.fields.amount')}</th>
            <th className="px-4 py-3 text-start font-medium">{t('fees.fields.status')}</th>
            {renderActions ? <th className="px-4 py-3 text-end font-medium">{t('common.actions')}</th> : null}
          </tr>
        </thead>
        <tbody className="divide-y">
          {fees.map((f) => (
            <tr key={f.id} className="hover:bg-slate-50/60">
              <td className="px-4 py-3">
                <div className="font-medium">{f.title}</div>
                {f.note ? <div className="text-xs text-slate-500">{f.note}</div> : null}
                {f.status === 'paid' && f.paid_at ? (
                  <div className="text-xs text-slate-400">
                    {t('fees.fields.paidAt')}: {formatDate(f.paid_at, i18n.language)}
                  </div>
                ) : null}
              </td>
              {showApartment ? <td className="px-4 py-3">{f.apartments?.unit_number ?? t('common.notAvailable')}</td> : null}
              <td className="px-4 py-3 whitespace-nowrap">{formatDate(f.due_date, i18n.language)}</td>
              <td className="px-4 py-3 text-end font-medium tabular-nums">{formatMoney(Number(f.amount), i18n.language)}</td>
              <td className="px-4 py-3">{renderStatus(f)}</td>
              {renderActions ? <td className="px-4 py-3 text-end">{renderActions(f)}</td> : null}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
