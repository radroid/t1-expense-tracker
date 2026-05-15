import { useCallback, useState } from 'react'
import {
  loadCurrency,
  saveCurrency,
  type CurrencyCode,
} from '../lib/currency'

export interface UseCurrency {
  currency: CurrencyCode
  setCurrency: (c: CurrencyCode) => void
}

/**
 * React state for the user's preferred display currency. Lazy-initialized
 * from localStorage (so first paint sees the persisted value) and writes
 * back synchronously on change.
 */
export function useCurrency(): UseCurrency {
  const [currency, setCurrencyState] = useState<CurrencyCode>(() =>
    loadCurrency(),
  )

  const setCurrency = useCallback((c: CurrencyCode) => {
    setCurrencyState(c)
    saveCurrency(c)
  }, [])

  return { currency, setCurrency }
}
