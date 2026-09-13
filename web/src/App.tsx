import { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router'
import { RequireAuth, RequireAdmin, RedirectIfAuthed, HomeRedirect } from '@/features/auth/guards'
import { AuthLayout } from '@/features/auth/AuthLayout'
import { LoginPage } from '@/features/auth/pages/LoginPage'
import { ForgotPasswordPage } from '@/features/auth/pages/ForgotPasswordPage'
import { SetPasswordPage } from '@/features/auth/pages/SetPasswordPage'
import { AppShell } from '@/components/layout/AppShell'
import { NotFound } from '@/components/NotFound'
import { Spinner } from '@/components/ui/misc'

// Tenant area
const TenantDashboardPage = lazy(() => import('@/features/tenant/DashboardPage').then((m) => ({ default: m.TenantDashboardPage })))
const TenantRequestsPage = lazy(() => import('@/features/tenant/RequestsPage').then((m) => ({ default: m.TenantRequestsPage })))
const NewRequestPage = lazy(() => import('@/features/tenant/NewRequestPage').then((m) => ({ default: m.NewRequestPage })))
const TenantRequestDetailPage = lazy(() => import('@/features/tenant/RequestDetailPage').then((m) => ({ default: m.TenantRequestDetailPage })))
const TenantAnnouncementsPage = lazy(() => import('@/features/tenant/AnnouncementsPage').then((m) => ({ default: m.TenantAnnouncementsPage })))
const TenantFeesPage = lazy(() => import('@/features/tenant/FeesPage').then((m) => ({ default: m.TenantFeesPage })))
const ProfilePage = lazy(() => import('@/features/tenant/ProfilePage').then((m) => ({ default: m.ProfilePage })))

// Admin area
const AdminDashboardPage = lazy(() => import('@/features/admin/DashboardPage').then((m) => ({ default: m.AdminDashboardPage })))
const AdminRequestsPage = lazy(() => import('@/features/admin/RequestsPage').then((m) => ({ default: m.AdminRequestsPage })))
const AdminRequestDetailPage = lazy(() => import('@/features/admin/RequestDetailPage').then((m) => ({ default: m.AdminRequestDetailPage })))
const AdminApartmentsPage = lazy(() => import('@/features/admin/ApartmentsPage').then((m) => ({ default: m.AdminApartmentsPage })))
const AdminApartmentDetailPage = lazy(() => import('@/features/admin/ApartmentDetailPage').then((m) => ({ default: m.AdminApartmentDetailPage })))
const AdminTenantsPage = lazy(() => import('@/features/admin/TenantsPage').then((m) => ({ default: m.AdminTenantsPage })))
const AdminAnnouncementsPage = lazy(() => import('@/features/admin/AnnouncementsPage').then((m) => ({ default: m.AdminAnnouncementsPage })))
const AdminFeesPage = lazy(() => import('@/features/admin/FeesPage').then((m) => ({ default: m.AdminFeesPage })))

export function App() {
  return (
    <Suspense fallback={<Spinner className="min-h-[50vh] items-center" />}>
      <Routes>
        <Route index element={<HomeRedirect />} />

        <Route element={<AuthLayout />}>
          <Route element={<RedirectIfAuthed />}>
            <Route path="login" element={<LoginPage />} />
            <Route path="forgot-password" element={<ForgotPasswordPage />} />
          </Route>
          <Route path="set-password" element={<SetPasswordPage />} />
        </Route>

        <Route element={<RequireAuth />}>
          <Route path="app" element={<AppShell area="tenant" />}>
            <Route index element={<TenantDashboardPage />} />
            <Route path="requests" element={<TenantRequestsPage />} />
            <Route path="requests/new" element={<NewRequestPage />} />
            <Route path="requests/:id" element={<TenantRequestDetailPage />} />
            <Route path="announcements" element={<TenantAnnouncementsPage />} />
            <Route path="fees" element={<TenantFeesPage />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="*" element={<NotFound />} />
          </Route>

          <Route element={<RequireAdmin />}>
            <Route path="admin" element={<AppShell area="admin" />}>
              <Route index element={<AdminDashboardPage />} />
              <Route path="requests" element={<AdminRequestsPage />} />
              <Route path="requests/:id" element={<AdminRequestDetailPage />} />
              <Route path="apartments" element={<AdminApartmentsPage />} />
              <Route path="apartments/:id" element={<AdminApartmentDetailPage />} />
              <Route path="tenants" element={<AdminTenantsPage />} />
              <Route path="announcements" element={<AdminAnnouncementsPage />} />
              <Route path="fees" element={<AdminFeesPage />} />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Route>
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  )
}
