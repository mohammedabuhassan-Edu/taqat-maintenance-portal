import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Plus, Check, Undo2, Trash2, MoreHorizontal } from 'lucide-react'
import { useCreateFees, useDeleteFee, useFees, useUpdateFee, summarize, type FeeRow } from '@/features/fees/api'
import { FeeStatusBadge, FeeTable } from '@/features/fees/components'
import { useApartments } from '@/features/apartments/api'
import { Button } from '@/components/ui/button'
import { Input, Select, Textarea } from '@/components/ui/input'
import { Field } from '@/components/ui/field'
import { ConfirmDialog, Dialog, DialogContent } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown'
import { EmptyState, ErrorBanner, PageHeader, Spinner, StatCard } from '@/components/ui/misc'
import { describeError } from '@/lib/errors'
import { tv } from '@/lib/forms'
import { formatMoney } from '@/lib/utils'
import type { FeeStatus } from '@/lib/database.types'

const schema = z.object({
  title: z.string().trim().min(2, 'validation.minLength|2').max(120, 'validation.maxLength|120'),
  amount: z.coerce.number<number>().positive('validation.positive'),
  due_date: z.string().min(1, 'validation.required'),
  target: z.string().min(1, 'validation.required'),
  note: z.string().trim().max(300, 'validation.maxLength|300'),
})
type FormValues = z.infer<typeof schema>

function nextMonthFirst() {
  const d = new Date()
  d.setMonth(d.getMonth() + 1, 1)
  return d.toISOString().slice(0, 10)
}

function NewFeeDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { t } = useTranslation()
  const apartments = useApartments()
  const create = useCreateFees()
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { title: '', amount: 0, due_date: nextMonthFirst(), target: 'all', note: '' },
  })

  const onSubmit = form.handleSubmit(async (v) => {
    try {
      const n = await create.mutateAsync({ ...v, note: v.note || null })
      toast.success(n === 1 ? t('fees.created') : t('fees.createdMany', { count: n }))
      onOpenChange(false)
      form.reset({ title: '', amount: 0, due_date: nextMonthFirst(), target: 'all', note: '' })
    } catch (e) {
      toast.error(describeError(e, t))
    }
  })

  const err = form.formState.errors
  const target = form.watch('target')
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title={t('fees.new')}>
        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <Field label={t('fees.fields.title')} htmlFor="fee_title" error={tv(t, err.title?.message)}>
            <Input id="fee_title" placeholder={t('fees.fields.titlePlaceholder')} {...form.register('title')} autoFocus />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t('fees.fields.amount')} htmlFor="fee_amount" error={tv(t, err.amount?.message)}>
              <Input id="fee_amount" type="number" step="0.01" min="0" inputMode="decimal" dir="ltr" {...form.register('amount')} />
            </Field>
            <Field label={t('fees.fields.dueDate')} htmlFor="fee_due" error={tv(t, err.due_date?.message)}>
              <Input id="fee_due" type="date" dir="ltr" {...form.register('due_date')} />
            </Field>
          </div>
          <Field label={t('fees.target')} htmlFor="fee_target" hint={target === 'all' ? t('fees.targetAllHint') : undefined} error={tv(t, err.target?.message)}>
            <Select id="fee_target" {...form.register('target')}>
              <option value="all">{t('fees.targetAll')}</option>
              <optgroup label={t('fees.targetOne')}>
                {apartments.data?.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.unit_number}
                  </option>
                ))}
              </optgroup>
            </Select>
          </Field>
          <Field label={t('fees.fields.note')} htmlFor="fee_note" optional={t('common.optional')} error={tv(t, err.note?.message)}>
            <Textarea id="fee_note" rows={2} {...form.register('note')} />
          </Field>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" loading={create.isPending}>
              {t('common.create')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function AdminFeesPage() {
  const { t, i18n } = useTranslation()
  const [status, setStatus] = React.useState<FeeStatus | ''>('unpaid')
  const [apartmentId, setApartmentId] = React.useState('')
  const apartments = useApartments()
  const fees = useFees({ status, apartment_id: apartmentId || undefined })
  const allFees = useFees({})
  const update = useUpdateFee()
  const del = useDeleteFee()
  const [creating, setCreating] = React.useState(false)
  const [deleting, setDeleting] = React.useState<FeeRow | null>(null)
  const summary = summarize(allFees.data ?? [])

  const togglePaid = async (f: FeeRow) => {
    try {
      await update.mutateAsync(
        f.status === 'paid' ? { id: f.id, status: 'unpaid', paid_at: null } : { id: f.id, status: 'paid', paid_at: new Date().toISOString() },
      )
      toast.success(t('fees.updated'))
    } catch (e) {
      toast.error(describeError(e, t))
    }
  }

  const onDelete = async () => {
    if (!deleting) return
    try {
      await del.mutateAsync(deleting.id)
      toast.success(t('fees.deleted'))
      setDeleting(null)
    } catch (e) {
      toast.error(describeError(e, t))
    }
  }

  const newButton = (
    <Button onClick={() => setCreating(true)}>
      <Plus />
      {t('fees.new')}
    </Button>
  )

  return (
    <div>
      <PageHeader title={t('fees.title')} actions={newButton} />
      <div className="mb-6 grid gap-3 sm:grid-cols-2">
        <StatCard label={t('fees.outstanding')} value={formatMoney(summary.unpaid, i18n.language)} hint={t('dashboard.stats.unpaidCount', { count: summary.unpaidCount })} tone={summary.unpaid > 0 ? 'warning' : 'success'} />
        <StatCard label={t('fees.paidTotal')} value={formatMoney(summary.paid, i18n.language)} />
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <Select value={status} onChange={(e) => setStatus(e.target.value as FeeStatus | '')} className="w-auto" aria-label={t('fees.fields.status')}>
          <option value="unpaid">{t('fees.unpaidOnly')}</option>
          <option value="paid">{t('fees.status.paid')}</option>
          <option value="">{t('common.all')}</option>
        </Select>
        <Select value={apartmentId} onChange={(e) => setApartmentId(e.target.value)} className="w-auto" aria-label={t('fees.fields.apartment')}>
          <option value="">{t('fees.fields.apartment')}: {t('common.all')}</option>
          {apartments.data?.map((a) => (
            <option key={a.id} value={a.id}>
              {a.unit_number}
            </option>
          ))}
        </Select>
      </div>

      {fees.isLoading ? (
        <Spinner />
      ) : fees.error ? (
        <ErrorBanner message={describeError(fees.error, t)} onRetry={() => void fees.refetch()} />
      ) : !fees.data || fees.data.length === 0 ? (
        <EmptyState title={t('fees.empty')} action={newButton} />
      ) : (
        <FeeTable
          fees={fees.data}
          showApartment
          renderStatus={(f) => <FeeStatusBadge fee={f} />}
          renderActions={(f) => (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" aria-label={t('common.actions')}>
                  <MoreHorizontal />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={() => void togglePaid(f)}>
                  {f.status === 'paid' ? <Undo2 /> : <Check />}
                  {t(f.status === 'paid' ? 'fees.markUnpaid' : 'fees.markPaid')}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => setDeleting(f)} className="text-red-600">
                  <Trash2 />
                  {t('common.delete')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        />
      )}

      <NewFeeDialog open={creating} onOpenChange={setCreating} />
      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title={t('common.areYouSure')}
        description={t('fees.deleteConfirm')}
        confirmLabel={t('common.delete')}
        destructive
        loading={del.isPending}
        onConfirm={() => void onDelete()}
      />
    </div>
  )
}
