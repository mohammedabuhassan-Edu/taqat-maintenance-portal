import * as React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { describeError } from '@/lib/errors'
import { useAuth } from '../AuthProvider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Field } from '@/components/ui/field'
import { Spinner } from '@/components/ui/misc'

const schema = z
  .object({
    password: z.string().min(8, 'validation.password'),
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, { path: ['confirm'], message: 'auth.passwordsDontMatch' })
type FormValues = z.infer<typeof schema>

/**
 * Landing page for invite and password-reset links. Supabase exchanges the
 * code in the URL for a session automatically; we wait for it, then let the
 * user choose a password.
 */
export function SetPasswordPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { session } = useAuth()
  const [timedOut, setTimedOut] = React.useState(false)
  const form = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { password: '', confirm: '' } })

  React.useEffect(() => {
    if (session) return
    const id = window.setTimeout(() => setTimedOut(true), 6000)
    return () => window.clearTimeout(id)
  }, [session])

  const hasAuthError = new URLSearchParams(window.location.search).has('error') || window.location.hash.includes('error=')

  const onSubmit = form.handleSubmit(async ({ password }) => {
    const { data, error } = await supabase.auth.updateUser({ password })
    if (error) {
      toast.error(describeError(error, t))
      return
    }
    toast.success(t('auth.passwordUpdated'))
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', data.user.id).maybeSingle()
    navigate(profile?.role === 'admin' ? '/admin' : '/app', { replace: true })
  })

  if (!session) {
    if (timedOut || hasAuthError) {
      return (
        <div className="space-y-4">
          <h1 className="text-xl font-semibold">{t('auth.setPasswordTitle')}</h1>
          <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-800">{t('auth.invalidLink')}</p>
          <div className="text-center text-sm">
            <Link to="/forgot-password" className="text-brand-700 hover:underline">
              {t('auth.forgotPassword')}
            </Link>
          </div>
        </div>
      )
    }
    return <Spinner />
  }

  return (
    <div>
      <h1 className="text-xl font-semibold">{t('auth.setPasswordTitle')}</h1>
      <p className="mt-1 text-sm text-slate-500">{t('auth.setPasswordHint')}</p>
      <form onSubmit={onSubmit} className="mt-6 space-y-4" noValidate>
        <Field label={t('auth.newPassword')} htmlFor="password" error={form.formState.errors.password && t(form.formState.errors.password.message!)}>
          <Input id="password" type="password" autoComplete="new-password" dir="ltr" {...form.register('password')} />
        </Field>
        <Field label={t('auth.confirmPassword')} htmlFor="confirm" error={form.formState.errors.confirm && t(form.formState.errors.confirm.message!)}>
          <Input id="confirm" type="password" autoComplete="new-password" dir="ltr" {...form.register('confirm')} />
        </Field>
        <Button type="submit" className="w-full" loading={form.formState.isSubmitting}>
          {t('auth.setPassword')}
        </Button>
      </form>
    </div>
  )
}
