import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useLocation, useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { describeError } from '@/lib/errors'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Field } from '@/components/ui/field'

const schema = z.object({
  email: z.string().trim().email('validation.email'),
  password: z.string().min(1, 'validation.required'),
})
type FormValues = z.infer<typeof schema>

export function LoginPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation() as { state?: { from?: { pathname: string }; expired?: boolean } }
  const form = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { email: '', password: '' } })

  const onSubmit = form.handleSubmit(async (values) => {
    const { data, error } = await supabase.auth.signInWithPassword(values)
    if (error) {
      toast.error(describeError(error, t))
      return
    }
    // Decide destination from the freshly loaded profile role.
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', data.user.id).maybeSingle()
    const from = location.state?.from?.pathname
    const fallback = profile?.role === 'admin' ? '/admin' : '/app'
    navigate(from && from !== '/login' ? from : fallback, { replace: true })
  })

  return (
    <div>
      <h1 className="text-xl font-semibold">{t('auth.welcomeBack')}</h1>
      <p className="mt-1 text-sm text-slate-500">{t('auth.signInHint')}</p>
      {location.state?.expired ? (
        <p className="mt-3 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800">{t('auth.sessionExpired')}</p>
      ) : null}
      <form onSubmit={onSubmit} className="mt-6 space-y-4" noValidate>
        <Field label={t('auth.email')} htmlFor="email" error={form.formState.errors.email && t(form.formState.errors.email.message!)}>
          <Input id="email" type="email" autoComplete="email" dir="ltr" {...form.register('email')} aria-invalid={!!form.formState.errors.email} />
        </Field>
        <Field label={t('auth.password')} htmlFor="password" error={form.formState.errors.password && t(form.formState.errors.password.message!)}>
          <Input id="password" type="password" autoComplete="current-password" dir="ltr" {...form.register('password')} aria-invalid={!!form.formState.errors.password} />
        </Field>
        <Button type="submit" className="w-full" loading={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? t('auth.signingIn') : t('auth.signIn')}
        </Button>
      </form>
      <div className="mt-4 text-center text-sm">
        <Link to="/forgot-password" className="text-brand-700 hover:underline">
          {t('auth.forgotPassword')}
        </Link>
      </div>
    </div>
  )
}
