import type { ComponentType } from 'react'
import { Link, Navigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import {
  ArrowRight,
  Bell,
  Building2,
  Camera,
  CheckCircle2,
  ClipboardList,
  LayoutDashboard,
  Languages,
  Receipt,
  Wrench,
} from 'lucide-react'
import { useAuth } from '@/features/auth/AuthProvider'
import { LanguageSwitcher } from '@/components/layout/LanguageSwitcher'
import { Button } from '@/components/ui/button'

const FEATURES: { key: string; icon: ComponentType<{ className?: string }> }[] = [
  { key: 'requests', icon: Wrench },
  { key: 'tracking', icon: ClipboardList },
  { key: 'announcements', icon: Bell },
  { key: 'fees', icon: Receipt },
  { key: 'admin', icon: LayoutDashboard },
  { key: 'bilingual', icon: Languages },
]

const STEPS = ['one', 'two', 'three'] as const

export function LandingPage() {
  const { t } = useTranslation()
  const { session, profile } = useAuth()

  // Returning users skip the marketing page and land in their area.
  if (session && profile) {
    return <Navigate to={profile.role === 'admin' ? '/admin' : '/app'} replace />
  }

  return (
    <div className="flex min-h-screen flex-col bg-white text-slate-900">
      <header className="sticky top-0 z-20 border-b border-slate-100 bg-white/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 lg:px-8">
          <Link to="/" className="flex items-center gap-2 text-brand-800">
            <Building2 className="size-6" />
            <span className="font-semibold">{t('app.name')}</span>
          </Link>
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <Button asChild size="sm">
              <Link to="/login">{t('landing.signIn')}</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden bg-gradient-to-b from-brand-50 via-white to-white">
          <div
            aria-hidden
            className="pointer-events-none absolute -top-40 start-1/2 h-[32rem] w-[32rem] -translate-x-1/2 rounded-full bg-brand-200/40 blur-3xl rtl:translate-x-1/2"
          />
          <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 py-20 lg:grid-cols-2 lg:px-8 lg:py-28">
            <div className="space-y-6">
              <span className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-white px-3 py-1 text-xs font-medium text-brand-800">
                <span className="size-1.5 rounded-full bg-brand-500" />
                {t('landing.badge')}
              </span>
              <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">{t('landing.heroTitle')}</h1>
              <p className="max-w-xl text-lg text-slate-600">{t('landing.heroSubtitle')}</p>
              <div className="flex flex-wrap items-center gap-3">
                <Button asChild size="lg">
                  <Link to="/login">
                    {t('landing.heroPrimary')}
                    <ArrowRight className="rtl:-scale-x-100" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <a href="#how-it-works">{t('landing.heroSecondary')}</a>
                </Button>
              </div>
              <p className="text-sm text-slate-500">{t('landing.inviteNote')}</p>
            </div>

            <HeroPreview />
          </div>
        </section>

        {/* Features */}
        <section className="mx-auto max-w-6xl px-4 py-20 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight">{t('landing.featuresTitle')}</h2>
            <p className="mt-3 text-slate-600">{t('landing.featuresSubtitle')}</p>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(({ key, icon: Icon }) => (
              <div
                key={key}
                className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="mb-4 inline-flex size-11 items-center justify-center rounded-xl bg-brand-50 text-brand-700 transition group-hover:bg-brand-100">
                  <Icon className="size-5" />
                </div>
                <h3 className="text-base font-semibold">{t(`landing.features.${key}.title`)}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{t(`landing.features.${key}.desc`)}</p>
              </div>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section id="how-it-works" className="bg-slate-50 py-20">
          <div className="mx-auto max-w-6xl px-4 lg:px-8">
            <h2 className="text-center text-3xl font-bold tracking-tight">{t('landing.stepsTitle')}</h2>
            <ol className="mt-12 grid gap-8 md:grid-cols-3">
              {STEPS.map((step, i) => (
                <li key={step} className="relative rounded-2xl bg-white p-6 shadow-sm">
                  <span className="mb-4 inline-flex size-10 items-center justify-center rounded-full bg-brand-600 text-sm font-bold text-white">
                    {i + 1}
                  </span>
                  <h3 className="text-base font-semibold">{t(`landing.steps.${step}.title`)}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">{t(`landing.steps.${step}.desc`)}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* CTA */}
        <section className="mx-auto max-w-6xl px-4 py-20 lg:px-8">
          <div className="rounded-3xl bg-brand-800 px-8 py-14 text-center text-white shadow-lg">
            <h2 className="text-3xl font-bold tracking-tight">{t('landing.ctaTitle')}</h2>
            <p className="mt-3 text-brand-100">{t('landing.ctaSubtitle')}</p>
            <Button asChild size="lg" variant="secondary" className="mt-8">
              <Link to="/login">
                {t('landing.heroPrimary')}
                <ArrowRight className="rtl:-scale-x-100" />
              </Link>
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-100">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-4 py-6 text-xs text-slate-500 sm:flex-row lg:px-8">
          <span className="flex items-center gap-2">
            <Building2 className="size-4" />
            {t('landing.footerRights')} · {new Date().getFullYear()}
          </span>
          <span>{t('app.credit')}</span>
        </div>
      </footer>
    </div>
  )
}

/** Decorative mock of the tenant request list, purely presentational. */
function HeroPreview() {
  const { t } = useTranslation()
  const rows = [
    { title: t('landing.features.requests.title'), status: 'in_progress', icon: Wrench },
    { title: t('landing.features.announcements.title'), status: 'new', icon: Bell },
    { title: t('landing.features.fees.title'), status: 'done', icon: CheckCircle2 },
  ] as const

  return (
    <div aria-hidden className="relative mx-auto w-full max-w-md lg:max-w-none">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xl shadow-brand-900/5">
        <div className="mb-4 flex items-center justify-between">
          <div className="h-3 w-24 rounded bg-slate-200" />
          <div className="flex gap-1.5">
            <span className="size-2.5 rounded-full bg-slate-200" />
            <span className="size-2.5 rounded-full bg-slate-200" />
            <span className="size-2.5 rounded-full bg-brand-300" />
          </div>
        </div>
        <div className="space-y-3">
          {rows.map(({ title, status, icon: Icon }) => (
            <div key={status} className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-white text-brand-700 shadow-sm">
                <Icon className="size-4" />
              </div>
              <div className="min-w-0 flex-1 space-y-1.5">
                <div className="truncate text-sm font-medium text-slate-800">{title}</div>
                <div className="h-2 w-2/3 rounded bg-slate-200" />
              </div>
              <span
                className={
                  'shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ' +
                  (status === 'done'
                    ? 'bg-emerald-100 text-emerald-700'
                    : status === 'in_progress'
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-sky-100 text-sky-700')
                }
              >
                {t(`requests.status.${status}`)}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-4 flex items-center gap-2 rounded-xl bg-brand-50 p-3 text-xs text-brand-800">
          <Camera className="size-4 shrink-0" />
          <div className="h-2 flex-1 rounded bg-brand-200" />
        </div>
      </div>
    </div>
  )
}
