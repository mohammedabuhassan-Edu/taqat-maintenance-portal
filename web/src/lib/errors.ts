import type { TFunction } from 'i18next'

interface ErrorLike {
  code?: string | number
  message?: string
  status?: number
  error?: { code?: string; message?: string }
}

/** Map Supabase / Edge Function errors to a translated, user-safe message. */
export function describeError(err: unknown, t: TFunction): string {
  const e = (err ?? {}) as ErrorLike
  const code = e.code ?? e.error?.code
  const message = (e.message ?? e.error?.message ?? '').toLowerCase()

  if (code === '42501' || message.includes('row-level security') || e.status === 403) {
    return t('errors.forbidden')
  }
  if (code === '23505' || message.includes('duplicate key')) return t('errors.duplicate')
  if (code === 'invalid_credentials' || message.includes('invalid login credentials')) {
    return t('errors.invalidCredentials')
  }
  if (message.includes('email not confirmed')) return t('errors.emailNotConfirmed')
  if (message.includes('failed to fetch') || message.includes('networkerror')) {
    return t('errors.network')
  }
  if (code === 'user_exists' || code === 'email_exists' || e.status === 409) {
    return t('errors.emailTaken')
  }
  if (message.includes('password should be')) return t('errors.weakPassword')
  return t('errors.generic')
}
