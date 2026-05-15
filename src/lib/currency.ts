// Single source of truth for currency display. Components and tests must
// import this rather than instantiating their own Intl.NumberFormat — keeps
// locale, symbol, and rounding consistent everywhere money is shown.
//
// P5.E — multi-currency. The app supports a small ISO 4217 allowlist via a
// user-pref persisted in localStorage (mirroring src/lib/theme.ts). Currency
// is a UI preference, not a per-expense field — totals would lie if expenses
// in mixed currencies were summed without conversion rates. v2 can revisit.

export type CurrencyCode = 'USD' | 'EUR' | 'GBP' | 'JPY'

// Pin the allowlist — used by validators + the UI selector. JPY exercises
// the zero-fraction-digit case so the formatter logic doesn't silently
// regress to "always 2 decimals".
export const CURRENCIES: ReadonlyArray<{
  code: CurrencyCode
  label: string
}> = [
  { code: 'USD', label: 'US Dollar (USD)' },
  { code: 'EUR', label: 'Euro (EUR)' },
  { code: 'GBP', label: 'British Pound (GBP)' },
  { code: 'JPY', label: 'Japanese Yen (JPY)' },
]

const DEFAULT_CURRENCY: CurrencyCode = 'USD'

export const CURRENCY_STORAGE_KEY = 'expense-tracker:currency'

/**
 * Type-narrowing guard. Accepts only strings inside the allowlist; rejects
 * unknown codes, non-strings, and null/undefined.
 */
export function isCurrencyCode(v: unknown): v is CurrencyCode {
  return (
    typeof v === 'string' &&
    CURRENCIES.some((c) => c.code === v)
  )
}

// Cache formatters per code — Intl.NumberFormat construction is non-trivial
// and the set is fixed at 4. Locale stays 'en-US' so changing CURRENCY
// doesn't secretly change number-grouping conventions in the same release.
const formatterCache = new Map<CurrencyCode, Intl.NumberFormat>()

function formatterFor(code: CurrencyCode): Intl.NumberFormat {
  let f = formatterCache.get(code)
  if (!f) {
    const fractionDigits = code === 'JPY' ? 0 : 2
    f = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: code,
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
    })
    formatterCache.set(code, f)
  }
  return f
}

/**
 * Formats `amount` in the given currency using Intl.NumberFormat. Pure.
 * JPY uses 0 fraction digits; USD/EUR/GBP use 2.
 */
export function formatCurrency(amount: number, code: CurrencyCode): string {
  return formatterFor(code).format(amount)
}

/**
 * Reads the stored currency. Returns 'USD' on miss/invalid.
 */
export function loadCurrency(): CurrencyCode {
  try {
    const raw = localStorage.getItem(CURRENCY_STORAGE_KEY)
    return isCurrencyCode(raw) ? raw : DEFAULT_CURRENCY
  } catch {
    return DEFAULT_CURRENCY
  }
}

/**
 * Persists the currency. Best-effort — swallows storage errors (e.g. quota).
 */
export function saveCurrency(code: CurrencyCode): void {
  try {
    localStorage.setItem(CURRENCY_STORAGE_KEY, code)
  } catch {
    // ignore
  }
}
