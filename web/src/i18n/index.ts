import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import en from './locales/en.json'
import ar from './locales/ar.json'

export const SUPPORTED_LANGS = ['en', 'ar'] as const
export type Lang = (typeof SUPPORTED_LANGS)[number]
/** Language shown to first-time visitors who have not picked one yet. */
export const DEFAULT_LANG: Lang = 'ar'

export function isLang(v: unknown): v is Lang {
  return typeof v === 'string' && (SUPPORTED_LANGS as readonly string[]).includes(v)
}

export function dirFor(lang: string): 'rtl' | 'ltr' {
  return lang.startsWith('ar') ? 'rtl' : 'ltr'
}

export function applyDocumentLang(lang: string) {
  if (typeof document === 'undefined') return
  document.documentElement.lang = lang
  document.documentElement.dir = dirFor(lang)
}

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      ar: { translation: ar },
    },
    fallbackLng: DEFAULT_LANG,
    supportedLngs: SUPPORTED_LANGS,
    load: 'languageOnly',
    nonExplicitSupportedLngs: true,
    interpolation: { escapeValue: false },
    detection: {
      // Only an explicit choice (persisted in localStorage) overrides the default;
      // the browser language is deliberately ignored.
      order: ['localStorage'],
      caches: ['localStorage'],
      lookupLocalStorage: 'portal.lang',
    },
  })

applyDocumentLang(i18n.resolvedLanguage ?? DEFAULT_LANG)
i18n.on('languageChanged', applyDocumentLang)

export default i18n
