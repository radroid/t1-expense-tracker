import { describe, it, expect } from 'vitest'
import type { Expense } from './expense'
import { summarizeByMonth, summarizeYear } from './trends'

function expense(amount: number, id: string, date: string): Expense {
  return { id, amount, description: 'test', date }
}

describe('summarizeByMonth', () => {
  it('returns [] for no expenses', () => {
    expect(summarizeByMonth([])).toEqual([])
  })

  it('sums multiple expenses in the same month into one entry', () => {
    const result = summarizeByMonth([
      expense(10, 'e1', '2026-05-01'),
      expense(25, 'e2', '2026-05-15'),
      expense(5, 'e3', '2026-05-28'),
    ])
    expect(result).toEqual([{ month: '2026-05', total: 40, count: 3 }])
  })

  it('sorts entries ascending by month', () => {
    const result = summarizeByMonth([
      expense(10, 'e1', '2026-05-01'),
      expense(20, 'e2', '2026-01-15'),
      expense(30, 'e3', '2026-03-15'),
    ])
    expect(result.map((r) => r.month)).toEqual([
      '2026-01',
      '2026-03',
      '2026-05',
    ])
  })

  it('handles expenses spanning multiple months and years', () => {
    const result = summarizeByMonth([
      expense(10, 'e1', '2025-12-15'),
      expense(20, 'e2', '2026-01-01'),
      expense(5, 'e3', '2025-12-20'),
    ])
    expect(result).toEqual([
      { month: '2025-12', total: 15, count: 2 },
      { month: '2026-01', total: 20, count: 1 },
    ])
  })
})

describe('summarizeYear', () => {
  it('returns 12 zero-entries (Jan…Dec) for no expenses', () => {
    const result = summarizeYear([], '2026')
    expect(result).toHaveLength(12)
    expect(result.map((r) => r.month)).toEqual([
      '2026-01',
      '2026-02',
      '2026-03',
      '2026-04',
      '2026-05',
      '2026-06',
      '2026-07',
      '2026-08',
      '2026-09',
      '2026-10',
      '2026-11',
      '2026-12',
    ])
    for (const r of result) {
      expect(r.total).toBe(0)
      expect(r.count).toBe(0)
    }
  })

  it('includes matching-year expenses and pads zero-months', () => {
    const result = summarizeYear(
      [
        expense(10, 'e1', '2026-01-15'),
        expense(20, 'e2', '2026-01-20'),
        expense(50, 'e3', '2026-07-04'),
      ],
      '2026',
    )
    expect(result).toHaveLength(12)
    expect(result[0]).toEqual({ month: '2026-01', total: 30, count: 2 })
    expect(result[6]).toEqual({ month: '2026-07', total: 50, count: 1 })
    // a zero-month
    expect(result[3]).toEqual({ month: '2026-04', total: 0, count: 0 })
  })

  it('excludes expenses from other years', () => {
    const result = summarizeYear(
      [
        expense(10, 'e1', '2025-05-15'),
        expense(20, 'e2', '2027-05-15'),
        expense(50, 'e3', '2026-05-15'),
      ],
      '2026',
    )
    const may = result.find((r) => r.month === '2026-05')
    expect(may).toEqual({ month: '2026-05', total: 50, count: 1 })
    // every other month is zero
    const totalAcrossOtherMonths = result
      .filter((r) => r.month !== '2026-05')
      .reduce((sum, r) => sum + r.total, 0)
    expect(totalAcrossOtherMonths).toBe(0)
  })

  it('throws on an invalid year string', () => {
    expect(() => summarizeYear([], 'bad-year')).toThrow()
  })
})
