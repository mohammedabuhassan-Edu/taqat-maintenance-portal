import * as React from 'react'
import { Link } from 'react-router'
import { useTranslation } from 'react-i18next'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Plus, MoreHorizontal, Pencil, Trash2, UserPlus } from 'lucide-react'
import { useApartmentsWithTenants, useDeleteApartment, useSaveApartment, type ApartmentWithTenants } from '@/features/apartments/api'
import { InviteTenantDialog } from '@/features/admin/TenantsPage'
import { Button } from '@/components/ui/button'
import { Input, Textarea } from '@/components/ui/input'
import { Field } from '@/components/ui/field'
import { Card, CardContent } from '@/components/ui/card'
import { ConfirmDialog, Dialog, DialogContent } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown'
import { EmptyState, ErrorBanner, PageHeader, Spinner } from '@/components/ui/misc'
import { Badge } from '@/components/ui/badge'
import { describeError } from '@/lib/errors'
import { tv } from '@/lib/forms'
import type { Apartment } from '@/lib/database.types'

const schema = z.object({
  unit_number: z.string().trim().min(1, 'validation.required').max(20, 'validation.maxLength|20'),
  floor: z.string().trim(),
  notes: z.string().trim().max(500, 'validation.maxLength|500'),
})
type FormValues = z.infer<typeof schema>

export function ApartmentDialog({ open, onOpenChange, apartment }: { open: boolean; onOpenChange: (o: boolean) => void; apartment?: Apartment | null }) {
  const { t } = useTranslation()
  const save = useSaveApartment()
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    values: { unit_number: apartment?.unit_number ?? '', floor: apartment?.floor?.toString() ?? '', notes: apartment?.notes ?? '' },
  })

  const onSubmit = form.handleSubmit(async (v) => {
    try {
      await save.mutateAsync({
        id: apartment?.id,
        unit_number: v.unit_number,
        floor: v.floor === '' ? null : Number(v.floor),
        notes: v.notes || null,
      })
      toast.success(t(apartment ? 'apartments.updated' : 'apartments.created'))
      onOpenChange(false)
      form.reset()
    } catch (e) {
      toast.error(describeError(e, t))
    }
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title={t(apartment ? 'apartments.editTitle' : 'apartments.new')}>
        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t('apartments.fields.unit')} htmlFor="unit_number" error={tv(t, form.formState.errors.unit_number?.message)}>
              <Input id="unit_number" placeholder={t('apartments.fields.unitPlaceholder')} {...form.register('unit_number')} autoFocus />
            </Field>
            <Field label={t('apartments.fields.floor')} htmlFor="floor" optional={t('common.optional')}>
              <Input id="floor" type="number" inputMode="numeric" {...form.register('floor')} />
            </Field>
          </div>
          <Field label={t('apartments.fields.notes')} htmlFor="notes" optional={t('common.optional')} error={tv(t, form.formState.errors.notes?.message)}>
            <Textarea id="notes" rows={3} {...form.register('notes')} />
          </Field>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" loading={save.isPending}>
              {t('common.save')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function AdminApartmentsPage() {
  const { t } = useTranslation()
  const { data, isLoading, error, refetch } = useApartmentsWithTenants()
  const del = useDeleteApartment()
  const [editing, setEditing] = React.useState<Apartment | null | 'new'>(null)
  const [deleting, setDeleting] = React.useState<Apartment | null>(null)
  const [inviting, setInviting] = React.useState<string | null>(null)

  const onDelete = async () => {
    if (!deleting) return
    try {
      await del.mutateAsync(deleting.id)
      toast.success(t('apartments.deleted'))
      setDeleting(null)
    } catch (e) {
      toast.error(describeError(e, t))
    }
  }

  const newButton = (
    <Button onClick={() => setEditing('new')}>
      <Plus />
      {t('apartments.new')}
    </Button>
  )

  return (
    <div>
      <PageHeader title={t('apartments.title')} actions={newButton} />
      {isLoading ? (
        <Spinner />
      ) : error ? (
        <ErrorBanner message={describeError(error, t)} onRetry={() => void refetch()} />
      ) : !data || data.length === 0 ? (
        <EmptyState title={t('apartments.empty')} action={newButton} />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((a) => (
            <ApartmentCard key={a.id} apartment={a} onEdit={() => setEditing(a)} onDelete={() => setDeleting(a)} onInvite={() => setInviting(a.id)} />
          ))}
        </div>
      )}

      <ApartmentDialog open={editing !== null} onOpenChange={(o) => !o && setEditing(null)} apartment={editing === 'new' ? null : editing} />
      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title={t('common.areYouSure')}
        description={t('apartments.deleteConfirm')}
        confirmLabel={t('common.delete')}
        destructive
        loading={del.isPending}
        onConfirm={() => void onDelete()}
      />
      <InviteTenantDialog open={!!inviting} onOpenChange={(o) => !o && setInviting(null)} defaultApartmentId={inviting ?? undefined} />
    </div>
  )
}

function ApartmentCard({ apartment, onEdit, onDelete, onInvite }: { apartment: ApartmentWithTenants; onEdit: () => void; onDelete: () => void; onInvite: () => void }) {
  const { t } = useTranslation()
  return (
    <Card className="flex flex-col">
      <CardContent className="flex flex-1 flex-col gap-3 pt-5">
        <div className="flex items-start justify-between gap-2">
          <Link to={`/admin/apartments/${apartment.id}`} className="group">
            <p className="text-lg font-semibold group-hover:text-brand-700">{apartment.unit_number}</p>
            {apartment.floor !== null ? (
              <p className="text-xs text-slate-500">
                {t('apartments.fields.floor')} {apartment.floor}
              </p>
            ) : null}
          </Link>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label={t('common.actions')}>
                <MoreHorizontal />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={onInvite}>
                <UserPlus />
                {t('apartments.inviteTenant')}
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={onEdit}>
                <Pencil />
                {t('common.edit')}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={onDelete} className="text-red-600">
                <Trash2 />
                {t('common.delete')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="flex-1">
          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-500">{t('apartments.fields.tenants')}</p>
          {apartment.tenants.length === 0 ? (
            <p className="text-sm text-slate-400">{t('apartments.noTenants')}</p>
          ) : (
            <ul className="space-y-1 text-sm">
              {apartment.tenants.map((tn) => (
                <li key={tn.id} className="flex items-center gap-2">
                  <span className={tn.is_active ? undefined : 'text-slate-400 line-through'}>{tn.full_name}</span>
                  {!tn.is_active ? <Badge variant="muted">{t('tenants.inactive')}</Badge> : null}
                </li>
              ))}
            </ul>
          )}
        </div>
        {apartment.notes ? <p className="text-xs text-slate-500">{apartment.notes}</p> : null}
      </CardContent>
    </Card>
  )
}
