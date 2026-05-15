import type { Expense } from './expense'
import type { Category } from './category'
import { monthOf } from './month'

// `string & {}` preserves autocomplete on the 'all' / 'uncategorized' literals.
// Without it TypeScript collapses the union to `string` and call sites lose
// hint about the special values.
export type CategoryFilterValue = 'all' | 'uncategorized' | (string & {})

/**
 * Filters expenses by category selection.
 *
 * - `'all'` → returns the input array (no copy).
 * - `'uncategorized'` → expenses with no `categoryId` OR a `categoryId` not in
 *   `categories` (orphans from deleted categories). Same bucket as
 *   `spendingByCategory`'s null entry.
 * - any other value → treated as a `categoryId`; returns expenses whose
 *   `categoryId` matches exactly.
 * - Pure. Does not mutate inputs.
 */
export function filterExpensesByCategory(
  expenses: Expense[],
  filter: CategoryFilterValue,
  categories: Category[],
): Expense[] {
  if (filter === 'all') return expenses

  if (filter === 'uncategorized') {
    const knownIds = new Set(categories.map((c) => c.id))
    return expenses.filter(
      (e) => e.categoryId === undefined || !knownIds.has(e.categoryId),
    )
  }

  return expenses.filter((e) => e.categoryId === filter)
}

// Filters expenses whose `date` falls within the given 'YYYY-MM' month.
// Pure. Does not mutate inputs.
export function filterExpensesByMonth(
  expenses: Expense[],
  month: string,
): Expense[] {
  return expenses.filter((e) => monthOf(e.date) === month)
}

/**
 * Filters expenses whose `description` contains `searchTerm` (case-insensitive
 * substring match). The term is trimmed before comparison.
 *
 * - Empty / whitespace-only `searchTerm` → returns input array (no copy),
 *   matching the `filterExpensesByCategory('all', …)` pass-through pattern.
 * - Pure. Does not mutate inputs.
 */
export function filterExpensesBySearch(
  expenses: Expense[],
  searchTerm: string,
): Expense[] {
  const trimmed = searchTerm.trim()
  if (trimmed === '') return expenses
  const needle = trimmed.toLowerCase()
  return expenses.filter((e) => e.description.toLowerCase().includes(needle))
}

/**
 * Filters expenses whose `date` falls within the inclusive range
 * `[range.from, range.to]`. Date strings are 'YYYY-MM-DD' so lexicographic
 * compare is correct.
 *
 * - `null` range → returns input array (no copy).
 * - Pure. Does not mutate inputs.
 */
export function filterExpensesByDateRange(
  expenses: Expense[],
  range: { from: string; to: string } | null,
): Expense[] {
  if (range === null) return expenses
  return expenses.filter((e) => e.date >= range.from && e.date <= range.to)
}
