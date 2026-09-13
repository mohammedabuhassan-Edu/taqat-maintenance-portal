import { Outlet } from 'react-router'
import { useTranslation } from 'react-i18next'
import { Building2 } from 'lucide-react'
import { LanguageSwitcher } from '@/components/layout/LanguageSwitcher'

export function AuthLayout() {
  const { t } = useTranslation()
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-brand-50 to-slate-50">
      <header className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2 text-brand-800">
          <Building2 className="size-6" />
          <span className="font-semibold">{t('app.name')}</span>
        </div>
        <LanguageSwitcher />
      </header>
      <main className="flex flex-1 items-center justify-center px-4 pb-16">
        <div className="w-full max-w-md rounded-2xl border bg-white p-8 shadow-sm">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
