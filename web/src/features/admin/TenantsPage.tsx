import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { MoreHorizontal, Pencil, UserPlus, UserX, UserCheck, Search } from 'lucide-react'
import { useInviteTenant, useTenants, useUpdateTenant } from '@/features/tenants/api'
import { useApartments } from '@/features/apartments/api'
import { Button } from '@/components/ui/button'
import { Input, Select } from '@/components/ui/input'
import { Field } from '@/components/ui/field'
import { Dialog, DialogContent, ConfirmDialog } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown'
import { Badge } from '@/components/ui/badge'
import { EmptyState, ErrorBanner, PageHeader, Spinner } from '@/components/ui/misc'
import { describeError } from '@/lib/errors'
import { tv } from '@/lib/forms'
import { SUPPORTED_LANGS } from '@/i18n'
import type { Profile } from '@/lib/database.types'

const inviteSchema = z.object({
  full_name: z.string().trim().min(2, 'validation.minLength|2').max(80, 'validation.maxLength|80'),
  email: z.string().trim().email('validation.email'),
  phone: z.string().trim().max(30, 'validation.maxLength|30'),
  apartment_id: z.string().min(1, 'validation.required'),
  preferred_lang: z.enum(SUPPORTED_LANGS),
})
type InviteValues = z.infer<typeof inviteSchema>

export function InviteTenantDialog({ open, onOpenChange, defaultApartmentId }: { open: boolean; onOpenChange: (o: boolean) => void; defaultApartmentId?: string }) {
  const { t, i18n } = useTranslation()
  const apartments = useApartments()
  const invite = useInviteTenant()
  const form = useForm<InviteValues>({
    resolver: zodResolver(inviteSchema),
    values: {
      full_name: '',
      email: '',
      phone: '',
      apartment_id: defaultApartmentId ?? '',
      preferred_lang: (i18n.resolvedLanguage as 'en' | 'ar') ?? 'en',
    },
    resetOptions: { keepDirtyValues: true },
  })

  const onSubmit = form.handleSubmit(async (v) => {
    try {
      await invite.mutateAsync({ ...v, phone: v.phone || null })
      toast.success(t('tenants.invited', { email: v.email }))
      onOpenChange(false)
      form.reset()
    } catch (e) {
      toast.error(describeError(e, t))
    }
  })

  const err = form.formState.errors
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title={t('tenants.inviteTitle')} description={t('tenants.inviteHint')}>
        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <Field label={t('tenants.fields.name')} htmlFor="inv_name" error={tv(t, err.full_name?.message)}>
            <Input id="inv_name" {...form.register('full_name')} autoFocus />
          </Field>
          <Field label={t('tenants.fields.email')} htmlFor="inv_email" error={tv(t, err.email?.message)}>
            <Input id="inv_email" type="email" dir="ltr" {...form.register('email')} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t('tenants.fields.phone')} htmlFor="inv_phone" optional={t('common.optional')} error={tv(t, err.phone?.message)}>
              <Input id="inv_phone" type="tel" dir="ltr" {...form.register('phone')} />
            </Field>
            <Field label={t('tenants.fields.language')} htmlFor="inv_lang">
              <Select id="inv_lang" {...form.register('preferred_lang')}>
                {SUPPORTED_LANGS.map((l) => (
                  <option key={l} value={l}>
                    {t(`languages.${l}`)}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <Field label={t('tenants.fields.apartment')} htmlFor="inv_apartment" error={tv(t, err.apartment_id?.message)}>
            <Select id="inv_apartment" {...form.register('apartment_id')}>
              <option value="">—</option>
              {apartments.data?.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.unit_number}
                </option>
              ))}
            </Select>
          </Field>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" loading={invite.isPending}>
              {invite.isPending ? t('tenants.sending') : t('tenants.sendInvite')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

const editSchema = z.object({
  full_name: z.string().trim().min(2, 'validation.minLength|2').max(80, 'validation.maxLength|80'),
  phone: z.string().trim().max(30, 'validation.maxLength|30'),
  apartment_id: z.string(),
  preferred_lang: z.enum(SUPPORTED_LANGS),
})
type EditValues = z.infer<typeof editSchema>

function EditTenantDialog({ tenant, onOpenChange }: { tenant: Profile | null; onOpenChange: (o: boolean) => void }) {
  const { t } = useTranslation()
  const apartments = useApartments()
  const update = useUpdateTenant()
  const form = useForm<EditValues>({
    resolver: zodResolver(editSchema),
    values: {
      full_name: tenant?.full_name ?? '',
      phone: tenant?.phone ?? '',
      apartment_id: tenant?.apartment_id ?? '',
      preferred_lang: tenant?.preferred_lang ?? 'en',
    },
  })

  const onSubmit = form.handleSubmit(async (v) => {
    if (!tenant) return
    try {
      await update.mutateAsync({ id: tenant.id, full_name: v.full_name, phone: v.phone || null, apartment_id: v.apartment_id || null, preferred_lang: v.preferred_lang })
      toast.success(t('tenants.updated'))
      onOpenChange(false)
    } catch (e) {
      toast.error(describeError(e, t))
    }
  })

  const err = form.formState.errors
  return (
    <Dialog open={!!tenant} onOpenChange={onOpenChange}>
      <DialogContent title={t('tenants.editTitle')}>
        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <Field label={t('tenants.fields.email')} htmlFor="ed_email">
            <Input id="ed_email" value={tenant?.email ?? ''} disabled dir="ltr" />
          </Field>
          <Field label={t('tenants.fields.name')} htmlFor="ed_name" error={tv(t, err.full_name?.message)}>
            <Input id="ed_name" {...form.register('full_name')} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t('tenants.fields.phone')} htmlFor="ed_phone" optional={t('common.optional')} error={tv(t, err.phone?.message)}>
              <Input id="ed_phone" type="tel" dir="ltr" {...form.register('phone')} />
            </Field>
            <Field label={t('tenants.fields.language')} htmlFor="ed_lang">
              <Select id="ed_lang" {...form.register('preferred_lang')}>
                {SUPPORTED_LANGS.map((l) => (
                  <option key={l} value={l}>
                    {t(`languages.${l}`)}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <Field label={t('tenants.fields.apartment')} htmlFor="ed_apartment">
            <Select id="ed_apartment" {...form.register('apartment_id')}>
              <option value="">{t('common.unassigned')}</option>
              {apartments.data?.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.unit_number}
                </option>
              ))}
            </Select>
          </Field>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" loading={update.isPending}>
              {t('common.save')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function AdminTenantsPage() {
  const { t } = useTranslation()
  const tenants = useTenants()
  const apartments = useApartments()
  const update = useUpdateTenant()
  const [inviting, setInviting] = React.useState(false)
  const [editing, setEditing] = React.useState<Profile | null>(null)
  const [toggling, setToggling] = React.useState<Profile | null>(null)
  const [search, setSearch] = React.useState('')

  const unitById = React.useMemo(() => new Map(apartments.data?.map((a) => [a.id, a.unit_number])), [apartments.data])

  const filtered = React.useMemo(() => {
    const s = search.trim().toLowerCase()
    if (!s) return tenants.data ?? []
    return (tenants.data ?? []).filter((p) => p.full_name.toLowerCase().includes(s) || (p.email ?? '').toLowerCase().includes(s))
  }, [tenants.data, search])

  const toggleActive = async () => {
    if (!toggling) return
    try {
      await update.mutateAsync({ id: toggling.id, is_active: !toggling.is_active })
      toast.success(t(toggling.is_active ? 'tenants.deactivated' : 'tenants.reactivated'))
      setToggling(null)
    } catch (e) {
      toast.error(describeError(e, t))
    }
  }

  const inviteButton = (
    <Button onClick={() => setInviting(true)}>
      <UserPlus />
      {t('tenants.invite')}
    </Button>
  )

  return (
    <div>
      <PageHeader title={t('tenants.title')} actions={inviteButton} />
      <div className="relative mb-4 max-w-sm">
        <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t('tenants.searchPlaceholder')} className="ps-9" aria-label={t('common.search')} />
      </div>

      {tenants.isLoading ? (
        <Spinner />
      ) : tenants.error ? (
        <ErrorBanner message={describeError(tenants.error, t)} onRetry={() => void tenants.refetch()} />
      ) : !tenants.data || tenants.data.length === 0 ? (
        <EmptyState title={t('tenants.empty')} action={inviteButton} />
      ) : filtered.length === 0 ? (
        <EmptyState title={t('common.noResults')} />
      ) : (
        <div className="overflow-x-auto rounded-xl border bg-white shadow-xs">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3 text-start font-medium">{t('tenants.fields.name')}</th>
                <th className="px-4 py-3 text-start font-medium">{t('tenants.fields.email')}</th>
                <th className="px-4 py-3 text-start font-medium">{t('tenants.fields.apartment')}</th>
                <th className="px-4 py-3 text-start font-medium">{t('tenants.fields.phone')}</th>
                <th className="px-4 py-3 text-end font-medium">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map((p) => (
                <tr key={p.id} className={p.is_active ? 'hover:bg-slate-50/60' : 'bg-slate-50/60 text-slate-400'}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 font-medium">
                      {p.full_name}
                      {!p.is_active ? <Badge variant="muted">{t('tenants.inactive')}</Badge> : null}
                    </div>
                  </td>
                  <td className="px-4 py-3" dir="ltr">
                    {p.email}
                  </td>
                  <td className="px-4 py-3">{p.apartment_id ? unitById.get(p.apartment_id) ?? '…' : <span className="text-slate-400">{t('common.unassigned')}</span>}</td>
                  <td className="px-4 py-3" dir="ltr">
                    {p.phone ?? ''}
                  </td>
                  <td className="px-4 py-3 text-end">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" aria-label={t('common.actions')}>
                          <MoreHorizontal />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onSelect={() => setEditing(p)}>
                          <Pencil />
                          {t('common.edit')}
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => setToggling(p)} className={p.is_active ? 'text-red-600' : undefined}>
                          {p.is_active ? <UserX /> : <UserCheck />}
                          {t(p.is_active ? 'tenants.deactivate' : 'tenants.reactivate')}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <InviteTenantDialog open={inviting} onOpenChange={setInviting} />
      <EditTenantDialog tenant={editing} onOpenChange={(o) => !o && setEditing(null)} />
      <ConfirmDialog
        open={!!toggling}
        onOpenChange={(o) => !o && setToggling(null)}
        title={t(toggling?.is_active ? 'tenants.deactivate' : 'tenants.reactivate')}
        description={toggling?.full_name}
        confirmLabel={t(toggling?.is_active ? 'tenants.deactivate' : 'tenants.reactivate')}
        destructive={!!toggling?.is_active}
        loading={update.isPending}
        onConfirm={() => void toggleActive()}
      />
    </div>
  )
}
