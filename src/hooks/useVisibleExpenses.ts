import { useMemo } from 'react'
import type { Expense } from '../lib/expense'
import type { Category } from '../lib/category'
import {
  filterExpensesByCategory,
  filterExpensesByMonth,
  type CategoryFilterValue,
} from '../lib/expenseFilter'

interface UseVisibleExpensesArgs {
  expenses: Expense[]
  selectedMonth: string
  categoryFilter: CategoryFilterValue
  categories: Category[]
}

export interface UseVisibleExpenses {
  // Expenses scoped to `selectedMonth` only — used by BudgetVsActual where the
  // budget covers the whole month regardless of the active category filter.
  monthlyExpenses: Expense[]
  // The user-visible slice: month-scoped AND category-filtered. Flows to
  // ExpenseList, RunningTotal, MonthlySummary, SpendingByCategory,
  // SpendingChart — every "what you see" surface.
  visibleExpenses: Expense[]
}

// Composes the expense view filters into one seam. Today: byMonth → byCategory.
// Future view-state (search, date-range) plugs in here so App.tsx doesn't grow
// a longer filter pipeline. Each layer is memoized independently — flipping
// the category filter doesn't recompute the monthlyExpenses array reference.
export function useVisibleExpenses({
  expenses,
  selectedMonth,
  categoryFilter,
  categories,
}: UseVisibleExpensesArgs): UseVisibleExpenses {
  const monthlyExpenses = useMemo(
    () => filterExpensesByMonth(expenses, selectedMonth),
    [expenses, selectedMonth],
  )

  const visibleExpenses = useMemo(
    () => filterExpensesByCategory(monthlyExpenses, categoryFilter, categories),
    [monthlyExpenses, categoryFilter, categories],
  )

  return { monthlyExpenses, visibleExpenses }
}
