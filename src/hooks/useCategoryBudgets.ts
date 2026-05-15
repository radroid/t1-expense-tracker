import { useCallback, useMemo } from 'react'
import {
  categoryBudgetId,
  createCategoryBudget,
  type CategoryBudget,
  type CategoryBudgetInput,
} from '../lib/categoryBudget'
import {
  getAllCategoryBudgets,
  removeCategoryBudget,
  setCategoryBudget,
} from '../db/categoryBudgetStore'
import { categoryBudgetMessages } from '../lib/errorMessages'
import {
  useStoredCollection,
  type Store,
} from './useStoredCollection'

export interface UseCategoryBudgets {
  categoryBudgets: CategoryBudget[]
  loading: boolean
  error: string
  // Upserts (composite-key `put`). The wrapper exposes `set(month, categoryId,
  // amount)` for callsite clarity; internally it routes through the generic
  // `add` of useStoredCollection.
  set: (
    month: string,
    categoryId: string,
    amount: number,
  ) => Promise<boolean>
  remove: (id: string) => Promise<boolean>
  // Convenience: returns the row for the (month, categoryId) pair, or undefined.
  getFor: (month: string, categoryId: string) => CategoryBudget | undefined
  refresh: () => Promise<void>
}

// Persistence-layer hook for per-category budgets. Mirrors useMonthlyBudgets
// — IDB `put` collapses add/update into one path, so we wire the generic's
// `add` to `setCategoryBudget` and expose the domain-shaped `set` on top.
export function useCategoryBudgets(): UseCategoryBudgets {
  // Closures rather than direct references so vi.spyOn on the store module
  // works in tests (the spy mutates the namespace; our closures re-resolve
  // through the live ESM binding on each call).
  const store = useMemo<Store<CategoryBudget>>(
    () => ({
      add: (b) => setCategoryBudget(b),
      getAll: () => getAllCategoryBudgets(),
      remove: (id) => removeCategoryBudget(id),
    }),
    [],
  )

  const collection = useStoredCollection<CategoryBudget, CategoryBudgetInput>({
    store,
    validateAdd: createCategoryBudget,
    messages: categoryBudgetMessages,
  })

  const { items, loading, error, add, remove, refresh } = collection

  const set = useCallback(
    (month: string, categoryId: string, amount: number): Promise<boolean> =>
      add({ month, categoryId, amount }),
    [add],
  )

  const getFor = useCallback(
    (month: string, categoryId: string): CategoryBudget | undefined => {
      const id = categoryBudgetId(month, categoryId)
      return items.find((b) => b.id === id)
    },
    [items],
  )

  return {
    categoryBudgets: items,
    loading,
    error,
    set,
    remove,
    getFor,
    refresh,
  }
}
