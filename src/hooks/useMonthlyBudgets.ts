import { useCallback, useMemo } from 'react'
import { createMonthlyBudget, type MonthlyBudget } from '../lib/budget'
import {
  getAllBudgets,
  removeBudget,
  setBudget,
} from '../db/budgetStore'
import { budgetMessages } from '../lib/errorMessages'
import {
  useStoredCollection,
  type Store,
} from './useStoredCollection'

export interface UseMonthlyBudgets {
  budgets: MonthlyBudget[]
  loading: boolean
  error: string
  // Upserts the budget for `month`. Returns true on success.
  set: (month: string, amount: number) => Promise<boolean>
  remove: (month: string) => Promise<boolean>
  // Convenience: returns the budget for the given month, or undefined.
  getFor: (month: string) => MonthlyBudget | undefined
  // Re-reads the store. Used by the backup-restore flow (P5.C).
  refresh: () => Promise<void>
}

interface BudgetInput {
  month: string
  amount: number
}

// Persistence-layer hook for monthly budgets. The underlying store uses
// `setBudget` (an IDB `put`/upsert) so there is no separate add vs. update —
// we wire the generic's `add` to `setBudget`. The domain-shaped `set(month,
// amount)` is the public method; tests reference it directly.
export function useMonthlyBudgets(): UseMonthlyBudgets {
  // Closures rather than direct references so vi.spyOn on the store module
  // works in tests (the spy mutates the namespace; our closures re-resolve
  // through the live ESM binding on each call).
  const store = useMemo<Store<MonthlyBudget>>(
    () => ({
      add: (b) => setBudget(b),
      getAll: () => getAllBudgets(),
      remove: (month) => removeBudget(month),
    }),
    [],
  )

  const collection = useStoredCollection<MonthlyBudget, BudgetInput>({
    store,
    validateAdd: createMonthlyBudget,
    messages: budgetMessages,
  })

  const { items, loading, error, add, remove, refresh } = collection

  const set = useCallback(
    (month: string, amount: number): Promise<boolean> => add({ month, amount }),
    [add],
  )

  const getFor = useCallback(
    (month: string): MonthlyBudget | undefined =>
      items.find((b) => b.month === month),
    [items],
  )

  return {
    budgets: items,
    loading,
    error,
    set,
    remove,
    getFor,
    refresh,
  }
}
