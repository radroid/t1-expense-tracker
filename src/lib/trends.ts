import type { Expense } from './expense'
import { parseYear } from './year'

export interface MonthTotal {
  month: string // 'YYYY-MM'
  total: number // sum of amounts in that month
  count: number // number of expenses in that month
}

/**
 * Pure. Aggregates expenses by their YYYY-MM prefix. Output is sorted
 * ascending by month string. Months with no expenses are NOT in the output —
 * callers that want a fixed 12-slot grid should use `summarizeYear`.
 */
export function summarizeByMonth(expenses: readonly Expense[]): MonthTotal[] {
  const byMonth = new Map<string, { total: number; count: number }>()
  for (const e of expenses) {
    const month = e.date.slice(0, 7)
    const entry = byMonth.get(month)
    if (entry === undefined) {
      byMonth.set(month, { total: e.amount, count: 1 })
    } else {
      entry.total += e.amount
      entry.count += 1
    }
  }
  return Array.from(byMonth, ([month, { total, count }]) => ({
    month,
    total,
    count,
  })).sort((a, b) => (a.month < b.month ? -1 : a.month > b.month ? 1 : 0))
}

/**
 * Pure. Returns exactly 12 entries — one per month of the given year — with
 * months that have no matching expenses appearing as total=0 / count=0.
 * Throws on an invalid 'YYYY' year string (via parseYear).
 */
export function summarizeYear(
  expenses: readonly Expense[],
  year: string,
): MonthTotal[] {
  parseYear(year) // throws on bad input
  const result: MonthTotal[] = []
  for (let m = 1; m <= 12; m += 1) {
    result.push({
      month: `${year}-${String(m).padStart(2, '0')}`,
      total: 0,
      count: 0,
    })
  }

  const prefix = `${year}-`
  for (const e of expenses) {
    if (!e.date.startsWith(prefix)) continue
    const monthNum = Number(e.date.slice(5, 7))
    if (!(monthNum >= 1 && monthNum <= 12)) continue
    const slot = result[monthNum - 1]
    slot.total += e.amount
    slot.count += 1
  }
  return result
}
