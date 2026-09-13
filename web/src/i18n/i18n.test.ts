import { describe, expect, it, beforeEach } from 'vitest'
import i18n, { applyDocumentLang, dirFor, isLang } from './index'
import en from './locales/en.json'
import ar from './locales/ar.json'

function flattenKeys(obj: Record<string, unknown>, prefix = ''): string[] {
  return Object.entries(obj).flatMap(([k, v]) =>
    v && typeof v === 'object' ? flattenKeys(v as Record<string, unknown>, `${prefix}${k}.`) : [`${prefix}${k}`],
  )
}

/** Strip plural suffixes so EN/AR key sets can be compared. */
function baseKeys(keys: string[]) {
  return new Set(keys.map((k) => k.replace(/_(zero|one|two|few|many|other)$/, '')))
}

describe('i18n', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('en')
  })

  it('maps language to text direction', () => {
    expect(dirFor('en')).toBe('ltr')
    expect(dirFor('ar')).toBe('rtl')
    expect(dirFor('ar-EG')).toBe('rtl')
  })

  it('recognises supported languages only', () => {
    expect(isLang('en')).toBe(true)
    expect(isLang('ar')).toBe(true)
    expect(isLang('fr')).toBe(false)
    expect(isLang(null)).toBe(false)
  })

  it('flips the document direction when switching to Arabic and back', async () => {
    await i18n.changeLanguage('ar')
    expect(document.documentElement.dir).toBe('rtl')
    expect(document.documentElement.lang).toBe('ar')
    await i18n.changeLanguage('en')
    expect(document.documentElement.dir).toBe('ltr')
  })

  it('applyDocumentLang sets both attributes', () => {
    applyDocumentLang('ar')
    expect(document.documentElement.dir).toBe('rtl')
    applyDocumentLang('en')
    expect(document.documentElement.dir).toBe('ltr')
  })

  it('has the same translation keys in English and Arabic', () => {
    const enKeys = baseKeys(flattenKeys(en))
    const arKeys = baseKeys(flattenKeys(ar))
    const missingInAr = [...enKeys].filter((k) => !arKeys.has(k))
    const missingInEn = [...arKeys].filter((k) => !enKeys.has(k))
    expect(missingInAr).toEqual([])
    expect(missingInEn).toEqual([])
  })

  it('pluralises counts in both languages', async () => {
    expect(i18n.t('requests.count', { count: 1 })).toBe('1 request')
    expect(i18n.t('requests.count', { count: 3 })).toBe('3 requests')
    await i18n.changeLanguage('ar')
    expect(i18n.t('requests.count', { count: 0 })).toBe('لا توجد طلبات')
    expect(i18n.t('requests.count', { count: 2 })).toBe('طلبان')
    expect(i18n.t('requests.count', { count: 5 })).toContain('5')
  })
})
