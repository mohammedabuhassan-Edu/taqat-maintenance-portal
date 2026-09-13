import { describe, expect, it } from 'vitest'
import i18n from '@/i18n'
import { describeError } from './errors'
import { formatMoney } from './utils'
import { tv } from './forms'
import { summarize } from '@/features/fees/api'

const t = i18n.getFixedT('en')

describe('describeError', () => {
  it('maps RLS denials to the forbidden message', () => {
    expect(describeError({ code: '42501', message: 'permission denied' }, t)).toBe(t('errors.forbidden'))
    expect(describeError({ message: 'new row violates row-level security policy' }, t)).toBe(t('errors.forbidden'))
    expect(describeError({ status: 403 }, t)).toBe(t('errors.forbidden'))
  })

  it('maps duplicates, credentials and network errors', () => {
    expect(describeError({ code: '23505' }, t)).toBe(t('errors.duplicate'))
    expect(describeError({ message: 'Invalid login credentials' }, t)).toBe(t('errors.invalidCredentials'))
    expect(describeError(new TypeError('Failed to fetch'), t)).toBe(t('errors.network'))
  })

  it('reads edge function error envelopes', () => {
    expect(describeError({ status: 409, error: { code: 'email_exists' } }, t)).toBe(t('errors.emailTaken'))
  })

  it('falls back to a generic message', () => {
    expect(describeError(undefined, t)).toBe(t('errors.generic'))
    expect(describeError({ message: 'something odd' }, t)).toBe(t('errors.generic'))
  })
})

describe('summarize', () => {
  it('splits paid and unpaid totals', () => {
    const s = summarize([
      { amount: 100, status: 'unpaid' },
      { amount: 50.5, status: 'unpaid' },
      { amount: 200, status: 'paid' },
    ])
    expect(s.unpaid).toBeCloseTo(150.5)
    expect(s.paid).toBe(200)
    expect(s.unpaidCount).toBe(2)
  })

  it('handles empty input', () => {
    expect(summarize([])).toEqual({ unpaid: 0, paid: 0, unpaidCount: 0 })
  })
})

describe('formatMoney', () => {
  it('always shows two decimals', () => {
    expect(formatMoney(1234.5, 'en')).toBe('1,234.50')
  })
})

describe('tv', () => {
  it('resolves plain keys and keys with counts', () => {
    expect(tv(t, 'validation.required')).toBe('This field is required')
    expect(tv(t, 'validation.minLength|3')).toBe('Must be at least 3 characters')
    expect(tv(t, undefined)).toBeUndefined()
  })
})
