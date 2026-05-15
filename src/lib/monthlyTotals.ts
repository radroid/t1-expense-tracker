import type { Expense } from './expense'
import { totalAmount } from './totals'

export interface MonthlySummary {
  total: number
  average: number
  count: number
}

/**
 * Summary stats for a month-filtered (or any) expenses array.
 * When count === 0, returns all zeros to avoid NaN from divide-by-zero. Pure.
 */
export function summarizeExpenses(expenses: Expense[]): MonthlySummary {
  const count = expenses.length
  if (count === 0) {
    return { total: 0, average: 0, count: 0 }
  }
  const total = totalAmount(expenses)
  return { total, average: total / count, count }
}
