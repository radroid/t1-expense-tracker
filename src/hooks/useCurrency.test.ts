import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { useCurrency } from './useCurrency'
import { CURRENCY_STORAGE_KEY } from '../lib/currency'

// localStorage shim is installed in src/test/setup.ts.

describe('useCurrency', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('lazy-inits from loadCurrency (default "USD" when unset)', () => {
    const { result } = renderHook(() => useCurrency())
    expect(result.current.currency).toBe('USD')
  })

  it('lazy-inits from a persisted value', () => {
    localStorage.setItem(CURRENCY_STORAGE_KEY, 'EUR')
    const { result } = renderHook(() => useCurrency())
    expect(result.current.currency).toBe('EUR')
  })

  it('setCurrency updates state and persists via saveCurrency', () => {
    const { result } = renderHook(() => useCurrency())
    act(() => result.current.setCurrency('JPY'))
    expect(result.current.currency).toBe('JPY')
    expect(localStorage.getItem(CURRENCY_STORAGE_KEY)).toBe('JPY')
  })

  it('setCurrency reference is stable across renders', () => {
    const { result, rerender } = renderHook(() => useCurrency())
    const first = result.current.setCurrency
    rerender()
    expect(result.current.setCurrency).toBe(first)
  })

  it('ignores a corrupt persisted value and falls back to USD', () => {
    localStorage.setItem(CURRENCY_STORAGE_KEY, 'XYZ')
    const { result } = renderHook(() => useCurrency())
    expect(result.current.currency).toBe('USD')
  })
})
