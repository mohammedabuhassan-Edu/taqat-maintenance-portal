import { Languages } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { SUPPORTED_LANGS, type Lang } from '@/i18n'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown'

interface Props {
  /** When provided, the choice is also persisted to this profile. */
  profileId?: string
}

export function LanguageSwitcher({ profileId }: Props) {
  const { t, i18n } = useTranslation()
  const current = (i18n.resolvedLanguage ?? 'en') as Lang

  const change = async (lang: Lang) => {
    if (lang === current) return
    await i18n.changeLanguage(lang)
    if (profileId) {
      await supabase.from('profiles').update({ preferred_lang: lang }).eq('id', profileId)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" aria-label={t('common.language')}>
          <Languages />
          <span>{t(`languages.${current}`)}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {SUPPORTED_LANGS.map((lang) => (
          <DropdownMenuItem key={lang} onSelect={() => void change(lang)} aria-current={lang === current}>
            <span className={lang === current ? 'font-semibold' : undefined}>{t(`languages.${lang}`)}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
