import type { Expense } from './expense'
import type { Category } from './category'

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
