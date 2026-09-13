/**
 * Zod schemas store i18n keys as messages, optionally with a count:
 * "validation.minLength|3". This resolves them to translated text.
 */
export function tv(t: (k: string, o?: Record<string, unknown>) => string, msg?: string): string | undefined {
  if (!msg) return undefined
  const [key, count] = msg.split('|')
  return t(key, count ? { count: Number(count) } : undefined)
}
