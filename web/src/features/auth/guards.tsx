import { Navigate, Outlet, useLocation } from 'react-router'
import { useTranslation } from 'react-i18next'
import { useAuth } from './AuthProvider'
import { Spinner, ErrorBanner } from '@/components/ui/misc'
import { Button } from '@/components/ui/button'
import { describeError } from '@/lib/errors'
import { isSupabaseConfigured } from '@/lib/supabase'

function FullPage({ children }: { children: React.ReactNode }) {
  return <div className="flex min-h-screen items-center justify-center p-6">{children}</div>
}

/** Requires a signed-in user with an active profile. Redirects to /login otherwise. */
export function RequireAuth() {
  const { t } = useTranslation()
  const { session, profileState, signOut } = useAuth()
  const location = useLocation()

  if (!isSupabaseConfigured) {
    return (
      <FullPage>
        <ErrorBanner message={t('errors.notConfigured')} />
      </FullPage>
    )
  }

  if (session === undefined) {
    return (
      <FullPage>
        <Spinner />
      </FullPage>
    )
  }

  if (!session) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  if (profileState.status === 'loading') {
    return (
      <FullPage>
        <Spinner />
      </FullPage>
    )
  }

  if (profileState.status === 'error') {
    return (
      <FullPage>
        <div className="w-full max-w-md space-y-4">
          <ErrorBanner message={describeError(profileState.error, t)} onRetry={() => window.location.reload()} />
          <Button variant="outline" onClick={() => void signOut()}>
            {t('common.logout')}
          </Button>
        </div>
      </FullPage>
    )
  }

  if (profileState.status === 'missing') {
    return (
      <FullPage>
        <div className="w-full max-w-md space-y-4 text-center">
          <p className="text-sm text-slate-700">{t('auth.noProfile')}</p>
          <Button variant="outline" onClick={() => void signOut()}>
            {t('common.logout')}
          </Button>
        </div>
      </FullPage>
    )
  }

  if (!profileState.profile.is_active) {
    return (
      <FullPage>
        <div className="w-full max-w-md space-y-4 text-center">
          <p className="text-sm text-slate-700">{t('auth.accountInactive')}</p>
          <Button variant="outline" onClick={() => void signOut()}>
            {t('common.logout')}
          </Button>
        </div>
      </FullPage>
    )
  }

  return <Outlet />
}

/** Only admins may pass; tenants are sent to their dashboard. */
export function RequireAdmin() {
  const { isAdmin } = useAuth()
  if (!isAdmin) return <Navigate to="/app" replace />
  return <Outlet />
}

/** Signed-in users visiting public auth pages go straight to their area. */
export function RedirectIfAuthed() {
  const { session, profile, recoveryFlow } = useAuth()
  if (session === undefined) {
    return (
      <FullPage>
        <Spinner />
      </FullPage>
    )
  }
  if (session && profile && !recoveryFlow) {
    return <Navigate to={profile.role === 'admin' ? '/admin' : '/app'} replace />
  }
  return <Outlet />
}