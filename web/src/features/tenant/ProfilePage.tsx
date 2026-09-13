import { useTranslation } from 'react-i18next'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { useAuth, useProfile } from '@/features/auth/AuthProvider'
import { useApartment } from '@/features/apartments/api'
import { supabase } from '@/lib/supabase'
import { describeError } from '@/lib/errors'
import { Button } from '@/components/ui/button'
import { Input, Select } from '@/components/ui/input'
import { Field } from '@/components/ui/field'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PageHeader } from '@/components/ui/misc'
import { SUPPORTED_LANGS } from '@/i18n'
import { tv } from '@/lib/forms'

const profileSchema = z.object({
  full_name: z.string().trim().min(2, 'validation.minLength|2').max(80, 'validation.maxLength|80'),
  phone: z.string().trim().max(30, 'validation.maxLength|30'),
  preferred_lang: z.enum(SUPPORTED_LANGS),
})
type ProfileValues = z.infer<typeof profileSchema>

const passwordSchema = z
  .object({ password: z.string().min(8, 'validation.password'), confirm: z.string() })
  .refine((v) => v.password === v.confirm, { path: ['confirm'], message: 'auth.passwordsDontMatch' })
type PasswordValues = z.infer<typeof passwordSchema>

export function ProfilePage() {
  const { t, i18n } = useTranslation()
  const me = useProfile()
  const { refreshProfile } = useAuth()
  const apartment = useApartment(me.apartment_id ?? undefined)

  const form = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { full_name: me.full_name, phone: me.phone ?? '', preferred_lang: me.preferred_lang },
  })
  const pw = useForm<PasswordValues>({ resolver: zodResolver(passwordSchema), defaultValues: { password: '', confirm: '' } })

  const saveProfile = form.handleSubmit(async (values) => {
    const { error } = await supabase
      .from('profiles')
      .update({ full_name: values.full_name, phone: values.phone || null, preferred_lang: values.preferred_lang })
      .eq('id', me.id)
    if (error) {
      toast.error(describeError(error, t))
      return
    }
    if (values.preferred_lang !== i18n.resolvedLanguage) await i18n.changeLanguage(values.preferred_lang)
    await refreshProfile()
    toast.success(t('profile.saved'))
  })

  const savePassword = pw.handleSubmit(async ({ password }) => {
    const { error } = await supabase.auth.updateUser({ password })
    if (error) {
      toast.error(describeError(error, t))
      return
    }
    pw.reset()
    toast.success(t('profile.passwordChanged'))
  })

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader title={t('profile.title')} />
      <Card>
        <CardContent className="pt-5">
          <form onSubmit={saveProfile} className="space-y-4" noValidate>
            <Field label={t('profile.fields.email')} htmlFor="email">
              <Input id="email" value={me.email ?? ''} disabled dir="ltr" />
            </Field>
            {me.role === 'tenant' ? (
              <Field label={t('profile.fields.apartment')} htmlFor="apartment">
                <Input id="apartment" value={apartment.data?.unit_number ?? t('common.unassigned')} disabled />
              </Field>
            ) : null}
            <Field label={t('profile.fields.name')} htmlFor="full_name" error={tv(t, form.formState.errors.full_name?.message)}>
              <Input id="full_name" {...form.register('full_name')} />
            </Field>
            <Field label={t('profile.fields.phone')} htmlFor="phone" optional={t('common.optional')} error={tv(t, form.formState.errors.phone?.message)}>
              <Input id="phone" type="tel" dir="ltr" {...form.register('phone')} />
            </Field>
            <Field label={t('profile.fields.language')} htmlFor="preferred_lang">
              <Select id="preferred_lang" {...form.register('preferred_lang')}>
                {SUPPORTED_LANGS.map((l) => (
                  <option key={l} value={l}>
                    {t(`languages.${l}`)}
                  </option>
                ))}
              </Select>
            </Field>
            <div className="flex justify-end">
              <Button type="submit" loading={form.formState.isSubmitting}>
                {t('common.save')}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('profile.changePassword')}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={savePassword} className="space-y-4" noValidate>
            <Field label={t('auth.newPassword')} htmlFor="new_password" error={tv(t, pw.formState.errors.password?.message)}>
              <Input id="new_password" type="password" autoComplete="new-password" dir="ltr" {...pw.register('password')} />
            </Field>
            <Field label={t('auth.confirmPassword')} htmlFor="confirm_password" error={tv(t, pw.formState.errors.confirm?.message)}>
              <Input id="confirm_password" type="password" autoComplete="new-password" dir="ltr" {...pw.register('confirm')} />
            </Field>
            <div className="flex justify-end">
              <Button type="submit" variant="secondary" loading={pw.formState.isSubmitting}>
                {t('profile.changePassword')}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
