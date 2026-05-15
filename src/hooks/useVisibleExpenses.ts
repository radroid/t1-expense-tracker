import { useMemo } from 'react'
import type { Expense } from '../lib/expense'
import type { Category } from '../lib/category'
import {
  filterExpensesByCategory,
  filterExpensesByDateRange,
  filterExpensesByMonth,
  filterExpensesBySearch,
  type CategoryFilterValue,
} from '../lib/expenseFilter'

interface UseVisibleExpensesArgs {
  expenses: Expense[]
  selectedMonth: string
  categoryFilter: CategoryFilterValue
  categories: Category[]
  searchTerm?: string
  dateRange?: { from: string; to: string } | null
}

export interface UseVisibleExpenses {
  // Expenses scoped to `selectedMonth` only — used by BudgetVsActual where the
  // budget covers the whole month regardless of the active category filter,
  // search term, or date-range filter. See pipeline note below for why this
  // intentionally bypasses the date-range narrowing.
  monthlyExpenses: Expense[]
  // The user-visible slice: month-scoped, then date-range / category / search
  // narrowed. Flows to ExpenseList, RunningTotal, MonthlySummary,
  // SpendingByCategory, SpendingChart — every "what you see" surface.
  visibleExpenses: Expense[]
}

// Pipeline:
//   expenses → byMonth → monthlyExpenses → byDateRange → byCategory → bySearch → visibleExpenses
//
// Budget-coherence rationale: `monthlyExpenses` deliberately stays
// month-scoped (NOT narrowed by `dateRange`) so BudgetVsActual reflects the
// user's mental model — "this month's budget vs this month's actual spend."
// The date-range filter narrows only the display/search surface
// (`visibleExpenses`), keeping the budget actual stable as the user explores
// sub-ranges of the month. Each stage is its own `useMemo` so flipping a
// downstream filter doesn't recompute upstream layers.
export function useVisibleExpenses({
  expenses,
  selectedMonth,
  categoryFilter,
  categories,
  searchTerm = '',
  dateRange = null,
}: UseVisibleExpensesArgs): UseVisibleExpenses {
  const monthlyExpenses = useMemo(
    () => filterExpensesByMonth(expenses, selectedMonth),
    [expenses, selectedMonth],
  )

  const dateRangedExpenses = useMemo(
    () => filterExpensesByDateRange(monthlyExpenses, dateRange),
    [monthlyExpenses, dateRange],
  )

  const categoryFilteredExpenses = useMemo(
    () => filterExpensesByCategory(dateRangedExpenses, categoryFilter, categories),
    [dateRangedExpenses, categoryFilter, categories],
  )

  const visibleExpenses = useMemo(
    () => filterExpensesBySearch(categoryFilteredExpenses, searchTerm),
    [categoryFilteredExpenses, searchTerm],
  )

  return { monthlyExpenses, visibleExpenses }
}
