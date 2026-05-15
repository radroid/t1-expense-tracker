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

  it('rounds amounts with more than 2 decimal places', () => {
    // Intl.NumberFormat uses 'halfExpand' rounding for USD by default — .555
    // rounds up to .56, .554 stays at .55. Pin the behaviour so a future
    // locale or rounding-mode swap fails loudly.
    expect(formatUSD(10.556)).toBe('$10.56')
    expect(formatUSD(10.554)).toBe('$10.55')
  })

  it('formats zero as $0.00', () => {
    expect(formatUSD(0)).toBe('$0.00')
  })

  it('formats large amounts with thousands separators', () => {
    expect(formatUSD(1234567.89)).toBe('$1,234,567.89')
  })
})
