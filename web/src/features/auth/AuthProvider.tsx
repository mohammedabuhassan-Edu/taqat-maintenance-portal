import * as React from 'react'
import type { Session } from '@supabase/supabase-js'
import { useTranslation } from 'react-i18next'
import { supabase } from '@/lib/supabase'
import type { Profile } from '@/lib/database.types'
import { isLang } from '@/i18n'
import { queryClient } from '@/lib/queryClient'

export type ProfileState =
  | { status: 'loading' }
  | { status: 'ready'; profile: Profile }
  | { status: 'missing' }
  | { status: 'error'; error: unknown }

export interface AuthContextValue {
  /** undefined while the initial session is being resolved */
  session: Session | null | undefined
  profileState: ProfileState
  profile: Profile | null
  isAdmin: boolean
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
  /** Set when a PASSWORD_RECOVERY / invite link is being processed */
  recoveryFlow: boolean
}

const AuthContext = React.createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { i18n } = useTranslation()
  const [session, setSession] = React.useState<Session | null | undefined>(undefined)
  const [profileState, setProfileState] = React.useState<ProfileState>({ status: 'loading' })
  const [recoveryFlow, setRecoveryFlow] = React.useState(false)

  const loadProfile = React.useCallback(async (userId: string) => {
    const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle()
    if (error) {
      setProfileState({ status: 'error', error })
      return
    }
    if (!data) {
      setProfileState({ status: 'missing' })
      return
    }
    setProfileState({ status: 'ready', profile: data })
  }, [])

  React.useEffect(() => {
    let cancelled = false
    supabase.auth.getSession().then(({ data }) => {
      if (cancelled) return
      setSession(data.session)
      if (data.session) void loadProfile(data.session.user.id)
      else setProfileState({ status: 'missing' })
    })

    const { data: sub } = supabase.auth.onAuthStateChange((event, next) => {
      if (event === 'PASSWORD_RECOVERY') setRecoveryFlow(true)
      setSession(next)
      if (next) {
        if (event === 'SIGNED_IN' || event === 'USER_UPDATED' || event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION') {
          void loadProfile(next.user.id)
        }
      } else {
        setProfileState({ status: 'missing' })
        queryClient.clear()
      }
    })
    return () => {
      cancelled = true
      sub.subscription.unsubscribe()
    }
  }, [loadProfile])

  // Apply the tenant's saved language once their profile is known.
  const appliedLangFor = React.useRef<string | null>(null)
  React.useEffect(() => {
    if (profileState.status !== 'ready') return
    const p = profileState.profile
    if (appliedLangFor.current === p.id) return
    appliedLangFor.current = p.id
    if (isLang(p.preferred_lang) && i18n.resolvedLanguage !== p.preferred_lang) {
      void i18n.changeLanguage(p.preferred_lang)
    }
  }, [profileState, i18n])

  const signOut = React.useCallback(async () => {
    await supabase.auth.signOut()
    queryClient.clear()
  }, [])

  const refreshProfile = React.useCallback(async () => {
    if (session?.user) await loadProfile(session.user.id)
  }, [session, loadProfile])

  const profile = profileState.status === 'ready' ? profileState.profile : null
  const value = React.useMemo<AuthContextValue>(
    () => ({
      session,
      profileState,
      profile,
      isAdmin: profile?.role === 'admin',
      signOut,
      refreshProfile,
      recoveryFlow,
    }),
    [session, profileState, profile, signOut, refreshProfile, recoveryFlow],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = React.useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

/** Convenience: profile is guaranteed inside protected routes. */
export function useProfile(): Profile {
  const { profile } = useAuth()
  if (!profile) throw new Error('useProfile used outside a protected route')
  return profile
}
