import { describe, it, expect } from 'vitest'
import type { Expense } from './expense'
import { summarizeExpenses } from './monthlyTotals'

function expense(amount: number, id: string): Expense {
  return { id, amount, description: 'test', date: '2026-01-01' }
}

describe('summarizeExpenses', () => {
  it('returns an all-zero summary for an empty array (no NaN)', () => {
    const summary = summarizeExpenses([])
    expect(summary).toEqual({ total: 0, average: 0, count: 0 })
    expect(Number.isNaN(summary.average)).toBe(false)
  })

  it('returns total === amount and average === amount for a single expense', () => {
    const summary = summarizeExpenses([expense(12.5, 'a')])
    expect(summary.total).toBe(12.5)
    expect(summary.average).toBe(12.5)
    expect(summary.count).toBe(1)
  })

  it('computes the arithmetic mean for multiple expenses', () => {
    const summary = summarizeExpenses([
      expense(10, 'a'),
      expense(20, 'b'),
      expense(30, 'c'),
    ])
    expect(summary.total).toBe(60)
    expect(summary.average).toBe(20)
    expect(summary.count).toBe(3)
  })

  it('handles fractional amounts cleanly', () => {
    const summary = summarizeExpenses([expense(0.1, 'a'), expense(0.2, 'b')])
    expect(summary.total).toBeCloseTo(0.3)
    expect(summary.average).toBeCloseTo(0.15)
    expect(summary.count).toBe(2)
  })

  it('does not mutate the input array', () => {
    const input = [expense(1, 'a'), expense(2, 'b')]
    summarizeExpenses(input)
    expect(input).toHaveLength(2)
    expect(input[0].amount).toBe(1)
    expect(input[1].amount).toBe(2)
  })

  it('works correctly when expenses is []', () => {
    expect(summarizeExpenses([])).toEqual({ total: 0, average: 0, count: 0 })
  })
})
