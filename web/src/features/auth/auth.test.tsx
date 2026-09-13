import { describe, expect, it, vi, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Route, Routes } from 'react-router'
import { renderWithProviders } from '@/test/utils'
import i18n from '@/i18n'
import type { Profile } from '@/lib/database.types'

const signInWithPassword = vi.fn()
vi.mock('@/lib/supabase', () => ({
  isSupabaseConfigured: true,
  PHOTO_BUCKET: 'request-photos',
  supabase: {
    auth: { signInWithPassword: (...args: unknown[]) => signInWithPassword(...args) },
    from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: { role: 'tenant' }, error: null }) }) }) }),
  },
}))

const authState: { isAdmin: boolean; session: unknown; profile: Profile | null } = {
  isAdmin: false,
  session: null,
  profile: null,
}
vi.mock('@/features/auth/AuthProvider', () => ({
  useAuth: () => ({
    session: authState.session,
    profile: authState.profile,
    isAdmin: authState.isAdmin,
    profileState: authState.profile ? { status: 'ready', profile: authState.profile } : { status: 'missing' },
    signOut: vi.fn(),
    refreshProfile: vi.fn(),
    recoveryFlow: false,
  }),
  useProfile: () => authState.profile,
}))

const { LoginPage } = await import('./pages/LoginPage')
const { RequireAdmin, RequireAuth } = await import('./guards')

const tenantProfile: Profile = {
  id: 'u1',
  full_name: 'Test Tenant',
  phone: null,
  role: 'tenant',
  apartment_id: 'a1',
  preferred_lang: 'en',
  is_active: true,
  is_demo: false,
  email: 't@example.com',
  created_at: new Date().toISOString(),
}

describe('LoginPage', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('en')
    signInWithPassword.mockReset()
  })

  it('shows validation errors and does not call Supabase on empty submit', async () => {
    renderWithProviders(<LoginPage />)
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }))
    expect(await screen.findByText('Enter a valid email address')).toBeInTheDocument()
    expect(screen.getByText('This field is required')).toBeInTheDocument()
    expect(signInWithPassword).not.toHaveBeenCalled()
  })

  it('submits trimmed credentials', async () => {
    signInWithPassword.mockResolvedValue({ data: { user: { id: 'u1' } }, error: null })
    renderWithProviders(<LoginPage />)
    await userEvent.type(screen.getByLabelText('Email'), '  a@b.co ')
    await userEvent.type(screen.getByLabelText('Password'), 'secret123')
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }))
    expect(signInWithPassword).toHaveBeenCalledWith({ email: 'a@b.co', password: 'secret123' })
  })

  it('renders in Arabic with RTL direction', async () => {
    await i18n.changeLanguage('ar')
    renderWithProviders(<LoginPage />)
    expect(screen.getByRole('button', { name: 'تسجيل الدخول' })).toBeInTheDocument()
    expect(document.documentElement.dir).toBe('rtl')
  })
})

describe('route guards', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('en')
  })

  it('RequireAuth redirects anonymous users to /login', () => {
    authState.session = null
    authState.profile = null
    renderWithProviders(
      <Routes>
        <Route path="/login" element={<p>login page</p>} />
        <Route element={<RequireAuth />}>
          <Route path="/app" element={<p>tenant home</p>} />
        </Route>
      </Routes>,
      { route: '/app' },
    )
    expect(screen.getByText('login page')).toBeInTheDocument()
  })

  it('RequireAdmin sends tenants to their dashboard', () => {
    authState.session = { user: { id: 'u1' } }
    authState.profile = tenantProfile
    authState.isAdmin = false
    renderWithProviders(
      <Routes>
        <Route path="/app" element={<p>tenant home</p>} />
        <Route element={<RequireAdmin />}>
          <Route path="/admin" element={<p>admin home</p>} />
        </Route>
      </Routes>,
      { route: '/admin' },
    )
    expect(screen.getByText('tenant home')).toBeInTheDocument()
  })

  it('RequireAdmin lets admins through', () => {
    authState.session = { user: { id: 'u2' } }
    authState.profile = { ...tenantProfile, id: 'u2', role: 'admin', apartment_id: null }
    authState.isAdmin = true
    renderWithProviders(
      <Routes>
        <Route path="/app" element={<p>tenant home</p>} />
        <Route element={<RequireAdmin />}>
          <Route path="/admin" element={<p>admin home</p>} />
        </Route>
      </Routes>,
      { route: '/admin' },
    )
    expect(screen.getByText('admin home')).toBeInTheDocument()
  })

  it('RequireAuth blocks deactivated tenants', () => {
    authState.session = { user: { id: 'u1' } }
    authState.profile = { ...tenantProfile, is_active: false }
    renderWithProviders(
      <Routes>
        <Route element={<RequireAuth />}>
          <Route path="/app" element={<p>tenant home</p>} />
        </Route>
      </Routes>,
      { route: '/app' },
    )
    expect(screen.queryByText('tenant home')).not.toBeInTheDocument()
    expect(screen.getByText(/deactivated/i)).toBeInTheDocument()
  })
})
