import { describe, it, expect } from 'vitest'
import type { Expense } from './expense'
import { totalAmount } from './totals'

function expense(amount: number, id: string): Expense {
  return { id, amount, description: 'test', date: '2026-01-01' }
}

describe('totalAmount', () => {
  it('returns 0 for an empty array', () => {
    expect(totalAmount([])).toBe(0)
  })

  it('returns the amount of a single expense', () => {
    expect(totalAmount([expense(12.5, 'a')])).toBe(12.5)
  })

  it('sums multiple expenses', () => {
    expect(totalAmount([expense(10, 'a'), expense(5.25, 'b'), expense(100, 'c')])).toBe(115.25)
  })

  it('handles floating-point amounts', () => {
    expect(totalAmount([expense(0.1, 'a'), expense(0.2, 'b')])).toBeCloseTo(0.3)
  })

  it('does not mutate the input array', () => {
    const input = [expense(1, 'a'), expense(2, 'b')]
    totalAmount(input)
    expect(input).toHaveLength(2)
  })
})
