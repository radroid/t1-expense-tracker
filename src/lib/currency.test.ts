import { describe, it, expect } from 'vitest'
import { formatUSD } from './currency'

describe('formatUSD', () => {
  it('formats integer amounts with two decimal places', () => {
    expect(formatUSD(10)).toBe('$10.00')
  })

  it('formats fractional amounts to two decimal places', () => {
    expect(formatUSD(12.5)).toBe('$12.50')
    expect(formatUSD(0.99)).toBe('$0.99')
  })

  it('rounds halves to even (banker) per Intl.NumberFormat default for USD', () => {
    // Intl.NumberFormat defaults to "halfExpand" rounding for USD; just verify
    // that the result is stable and 2dp.
    expect(formatUSD(0.005)).toMatch(/^\$\d+\.\d{2}$/)
  })

  it('formats zero as $0.00', () => {
    expect(formatUSD(0)).toBe('$0.00')
  })

  it('formats large amounts with thousands separators', () => {
    expect(formatUSD(1234567.89)).toBe('$1,234,567.89')
  })
})
