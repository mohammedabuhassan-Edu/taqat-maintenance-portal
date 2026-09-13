import { describe, expect, it, vi, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import { Route, Routes } from 'react-router'
import { renderWithProviders } from '@/test/utils'
import i18n from '@/i18n'
import type { Profile } from '@/lib/database.types'

vi.mock('@/lib/supabase', () => ({
  isSupabaseConfigured: true,
  PHOTO_BUCKET: 'request-photos',
  supabase: { from: () => ({ update: () => ({ eq: async () => ({ error: null }) }) }) },
}))

const authState: { session: unknown; profile: Profile | null } = { session: null, profile: null }
vi.mock('@/features/auth/AuthProvider', () => ({
  useAuth: () => ({ session: authState.session, profile: authState.profile, isAdmin: authState.profile?.role === 'admin' }),
}))

const { LandingPage } = await import('./LandingPage')

const adminProfile: Profile = {
  id: 'u1',
  full_name: 'Admin',
  phone: null,
  role: 'admin',
  apartment_id: null,
  preferred_lang: 'en',
  is_active: true,
  email: 'a@example.com',
  created_at: new Date().toISOString(),
}

function renderLanding() {
  return renderWithProviders(
    <Routes>
      <Route index element={<LandingPage />} />
      <Route path="login" element={<div>login page</div>} />
      <Route path="admin" element={<div>admin area</div>} />
    </Routes>,
    { route: '/' },
  )
}

describe('LandingPage', () => {
  beforeEach(async () => {
    authState.session = null
    authState.profile = null
    await i18n.changeLanguage('en')
  })

  it('shows the hero and links to sign in for anonymous visitors', () => {
    renderLanding()
    expect(screen.getByRole('heading', { level: 1, name: /handled in one place/i })).toBeInTheDocument()
    const links = screen.getAllByRole('link', { name: /sign in/i })
    expect(links.length).toBeGreaterThan(0)
    for (const link of links) expect(link).toHaveAttribute('href', '/login')
    expect(screen.getByText(/made by mohammed abuhassan/i)).toBeInTheDocument()
  })

  it('sends signed-in users straight to their area', () => {
    authState.session = { user: { id: 'u1' } }
    authState.profile = adminProfile
    renderLanding()
    expect(screen.getByText('admin area')).toBeInTheDocument()
  })

  it('renders in Arabic', async () => {
    await i18n.changeLanguage('ar')
    renderLanding()
    expect(screen.getByRole('heading', { level: 1, name: /صيانة العمارة/ })).toBeInTheDocument()
  })
})
