import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest'
import {
  CURRENCIES,
  CURRENCY_STORAGE_KEY,
  formatCurrency,
  isCurrencyCode,
  loadCurrency,
  saveCurrency,
} from './currency'

// localStorage shim is installed in src/test/setup.ts.

describe('CURRENCIES allowlist', () => {
  it('lists USD, EUR, GBP, JPY in that order', () => {
    expect(CURRENCIES.map((c) => c.code)).toEqual([
      'USD',
      'EUR',
      'GBP',
      'JPY',
    ])
  })

  it('every entry has a non-empty label', () => {
    for (const c of CURRENCIES) {
      expect(c.label.length).toBeGreaterThan(0)
    }
  })
})

describe('formatCurrency', () => {
  it('formats USD with $ prefix and 2 decimals', () => {
    expect(formatCurrency(100, 'USD')).toBe('$100.00')
  })

  it('formats EUR with € prefix and 2 decimals (en-US locale)', () => {
    expect(formatCurrency(100, 'EUR')).toBe('€100.00')
  })

  it('formats GBP with £ prefix and 2 decimals', () => {
    expect(formatCurrency(100, 'GBP')).toBe('£100.00')
  })

  it('formats JPY with ¥ prefix and ZERO decimals', () => {
    expect(formatCurrency(100, 'JPY')).toBe('¥100')
  })

  it('JPY rounds fractional amounts to the nearest integer (halfExpand)', () => {
    expect(formatCurrency(1234.56, 'JPY')).toBe('¥1,235')
    expect(formatCurrency(1234.4, 'JPY')).toBe('¥1,234')
  })

  it('uses en-US thousands separators across all currencies', () => {
    expect(formatCurrency(1234567.89, 'USD')).toBe('$1,234,567.89')
    expect(formatCurrency(1234567.89, 'EUR')).toBe('€1,234,567.89')
    expect(formatCurrency(1234567.89, 'GBP')).toBe('£1,234,567.89')
  })

  it('formats zero correctly per currency', () => {
    expect(formatCurrency(0, 'USD')).toBe('$0.00')
    expect(formatCurrency(0, 'JPY')).toBe('¥0')
  })
})

describe('isCurrencyCode', () => {
  it('returns true for each allowlisted code', () => {
    expect(isCurrencyCode('USD')).toBe(true)
    expect(isCurrencyCode('EUR')).toBe(true)
    expect(isCurrencyCode('GBP')).toBe(true)
    expect(isCurrencyCode('JPY')).toBe(true)
  })

  it('returns false for unknown codes', () => {
    expect(isCurrencyCode('XYZ')).toBe(false)
    expect(isCurrencyCode('usd')).toBe(false) // case-sensitive
    expect(isCurrencyCode('')).toBe(false)
  })

  it('returns false for non-strings', () => {
    expect(isCurrencyCode(null)).toBe(false)
    expect(isCurrencyCode(undefined)).toBe(false)
    expect(isCurrencyCode(123)).toBe(false)
    expect(isCurrencyCode({})).toBe(false)
  })
})

describe('loadCurrency / saveCurrency', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('loadCurrency returns "USD" when localStorage is empty', () => {
    expect(loadCurrency()).toBe('USD')
  })

  it('loadCurrency returns the stored currency when set', () => {
    localStorage.setItem(CURRENCY_STORAGE_KEY, 'EUR')
    expect(loadCurrency()).toBe('EUR')
  })

  it('loadCurrency returns "USD" when localStorage has garbage', () => {
    localStorage.setItem(CURRENCY_STORAGE_KEY, 'XYZ')
    expect(loadCurrency()).toBe('USD')
  })

  it('saveCurrency persists and is round-trip-readable via loadCurrency', () => {
    saveCurrency('GBP')
    expect(loadCurrency()).toBe('GBP')
    saveCurrency('JPY')
    expect(loadCurrency()).toBe('JPY')
  })
})

describe('currency storage — defensive try/catch paths', () => {
  // localStorage in real browsers can throw on getItem/setItem (e.g.
  // SecurityError in private mode, QuotaExceededError on writes). The
  // shim never throws on its own, so we spy on the prototype to drive
  // the catch branches.
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('loadCurrency returns "USD" when localStorage.getItem throws', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('SecurityError')
    })
    expect(loadCurrency()).toBe('USD')
  })

  it('saveCurrency silently swallows a setItem throw', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError')
    })
    expect(() => saveCurrency('EUR')).not.toThrow()
  })
})
