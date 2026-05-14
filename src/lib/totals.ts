import type { Expense } from './expense'

/** Sum of every expense's amount. Empty array → 0. Pure. */
export function totalAmount(expenses: Expense[]): number {
  return expenses.reduce((sum, expense) => sum + expense.amount, 0)
}
