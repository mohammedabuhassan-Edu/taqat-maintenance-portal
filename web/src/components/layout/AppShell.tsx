import * as React from 'react'
import { NavLink, Outlet } from 'react-router'
import { useTranslation } from 'react-i18next'
import {
  Building2,
  LayoutDashboard,
  Wrench,
  Megaphone,
  Receipt,
  DoorOpen,
  Users,
  UserCircle,
  LogOut,
  Menu,
  X,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth, useProfile } from '@/features/auth/AuthProvider'
import { Button } from '@/components/ui/button'
import { LanguageSwitcher } from './LanguageSwitcher'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown'

interface NavItem {
  to: string
  labelKey: string
  icon: LucideIcon
  end?: boolean
}

const tenantNav: NavItem[] = [
  { to: '/app', labelKey: 'nav.dashboard', icon: LayoutDashboard, end: true },
  { to: '/app/requests', labelKey: 'nav.myRequests', icon: Wrench },
  { to: '/app/announcements', labelKey: 'nav.announcements', icon: Megaphone },
  { to: '/app/fees', labelKey: 'nav.myFees', icon: Receipt },
  { to: '/app/profile', labelKey: 'nav.profile', icon: UserCircle },
]

const adminNav: NavItem[] = [
  { to: '/admin', labelKey: 'nav.dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/requests', labelKey: 'nav.requests', icon: Wrench },
  { to: '/admin/apartments', labelKey: 'nav.apartments', icon: DoorOpen },
  { to: '/admin/tenants', labelKey: 'nav.tenants', icon: Users },
  { to: '/admin/announcements', labelKey: 'nav.announcements', icon: Megaphone },
  { to: '/admin/fees', labelKey: 'nav.fees', icon: Receipt },
]

export function AppShell({ area }: { area: 'tenant' | 'admin' }) {
  const { t } = useTranslation()
  const { signOut, isAdmin } = useAuth()
  const profile = useProfile()
  const [open, setOpen] = React.useState(false)
  const close = () => setOpen(false)

  const items = area === 'admin' ? adminNav : tenantNav

  const nav = (
    <nav className="flex flex-1 flex-col gap-1 p-3">
      {items.map(({ to, labelKey, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          onClick={close}
          className={({ isActive }) =>
            cn(
              'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
              isActive ? 'bg-brand-700 text-white' : 'text-slate-700 hover:bg-slate-100',
            )
          }
        >
          <Icon className="size-4 shrink-0" />
          {t(labelKey)}
        </NavLink>
      ))}
      {isAdmin ? (
        <NavLink
          to={area === 'admin' ? '/app' : '/admin'}
          onClick={close}
          className="mt-4 flex items-center gap-3 rounded-lg px-3 py-2 text-xs font-medium text-slate-500 hover:bg-slate-100"
        >
          {area === 'admin' ? <UserCircle className="size-4" /> : <LayoutDashboard className="size-4" />}
          {area === 'admin' ? t('nav.tenantArea') : t('nav.adminArea')}
        </NavLink>
      ) : null}
    </nav>
  )

  const brand = (
    <div className="flex h-16 items-center gap-2 border-b px-5 text-brand-800">
      <Building2 className="size-6" />
      <div className="leading-tight">
        <div className="font-semibold">{t('app.name')}</div>
        <div className="text-[11px] text-slate-500">{area === 'admin' ? t('nav.adminArea') : t('nav.tenantArea')}</div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen lg:flex">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col border-e bg-white lg:flex">
        {brand}
        {nav}
      </aside>

      {/* Mobile drawer */}
      {open ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 start-0 flex w-72 flex-col bg-white shadow-xl">
            <div className="flex items-center justify-between pe-3">
              {brand}
              <Button variant="ghost" size="icon" onClick={() => setOpen(false)} aria-label={t('common.close')}>
                <X />
              </Button>
            </div>
            {nav}
          </aside>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b bg-white/90 px-4 backdrop-blur lg:px-8">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setOpen(true)} aria-label={t('common.menu')}>
              <Menu />
            </Button>
            <span className="text-sm text-slate-500 lg:hidden">{t('app.name')}</span>
          </div>
          <div className="flex items-center gap-1">
            <LanguageSwitcher profileId={profile.id} />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="max-w-48">
                  <span className="flex size-7 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-800">
                    {initials(profile.full_name)}
                  </span>
                  <span className="truncate">{profile.full_name}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>{profile.email ?? profile.full_name}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <NavLink to="/app/profile">
                    <UserCircle />
                    {t('nav.profile')}
                  </NavLink>
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => void signOut()} className="text-red-600">
                  <LogOut />
                  {t('common.logout')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        <main className="flex-1 px-4 py-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('')
}
