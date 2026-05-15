import type { Expense } from './expense'
import type { Category } from './category'

export interface CategoryTotal {
  category: Category | null
  total: number
}

/**
 * Groups expenses by categoryId and sums amount per group.
 *
 * - Each Category in `categories` that has >=1 matching expense becomes
 *   one entry { category, total }.
 * - Expenses with no `categoryId` OR a `categoryId` not in `categories`
 *   (orphans from deleted categories) all bucket into a single
 *   { category: null, total } entry.
 * - Categories with zero expenses are omitted (no zero-total rows).
 * - Pure. Does not mutate inputs.
 * - Return order is unspecified.
 */
export function spendingByCategory(
  expenses: Expense[],
  categories: Category[],
): CategoryTotal[] {
  const categoryById = new Map<string, Category>()
  for (const c of categories) {
    categoryById.set(c.id, c)
  }

  const knownTotals = new Map<string, number>()
  let nullTotal = 0
  let hasNullBucket = false

  for (const e of expenses) {
    if (e.categoryId !== undefined && categoryById.has(e.categoryId)) {
      const prev = knownTotals.get(e.categoryId) ?? 0
      knownTotals.set(e.categoryId, prev + e.amount)
    } else {
      nullTotal += e.amount
      hasNullBucket = true
    }
  }

  const result: CategoryTotal[] = []
  for (const [id, total] of knownTotals) {
    const cat = categoryById.get(id)
    if (cat !== undefined) {
      result.push({ category: cat, total })
    }
  }
  if (hasNullBucket) {
    result.push({ category: null, total: nullTotal })
  }
  return result
}
