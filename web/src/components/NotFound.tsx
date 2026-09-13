import { Link } from 'react-router'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'

export function NotFound() {
  const { t } = useTranslation()
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-center">
      <p className="text-5xl font-bold text-slate-200">404</p>
      <h1 className="text-xl font-semibold">{t('errors.notFound')}</h1>
      <p className="text-sm text-slate-500">{t('errors.notFoundHint')}</p>
      <Button asChild variant="outline">
        <Link to="/">{t('errors.goHome')}</Link>
      </Button>
    </div>
  )
}
