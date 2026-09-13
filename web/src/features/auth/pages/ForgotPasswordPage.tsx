import * as React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link } from 'react-router'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { describeError } from '@/lib/errors'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Field } from '@/components/ui/field'
import { appUrl } from '@/lib/urls'

const schema = z.object({ email: z.string().trim().email('validation.email') })
type FormValues = z.infer<typeof schema>

export function ForgotPasswordPage() {
  const { t } = useTranslation()
  const [sent, setSent] = React.useState(false)
  const form = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { email: '' } })

  const onSubmit = form.handleSubmit(async ({ email }) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: appUrl('/set-password') })
    if (error && !/rate limit/i.test(error.message)) {
      toast.error(describeError(error, t))
      return
    }
    setSent(true)
  })

  return (
    <div>
      <h1 className="text-xl font-semibold">{t('auth.forgotPassword')}</h1>
      {sent ? (
        <p className="mt-4 rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{t('auth.resetSent')}</p>
      ) : (
        <form onSubmit={onSubmit} className="mt-6 space-y-4" noValidate>
          <Field label={t('auth.email')} htmlFor="email" error={form.formState.errors.email && t(form.formState.errors.email.message!)}>
            <Input id="email" type="email" autoComplete="email" dir="ltr" {...form.register('email')} />
          </Field>
          <Button type="submit" className="w-full" loading={form.formState.isSubmitting}>
            {t('auth.sendResetLink')}
          </Button>
        </form>
      )}
      <div className="mt-4 text-center text-sm">
        <Link to="/login" className="text-brand-700 hover:underline">
          {t('auth.backToLogin')}
        </Link>
      </div>
    </div>
  )
}
