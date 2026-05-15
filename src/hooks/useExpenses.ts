import { useCallback, useMemo } from 'react'
import {
  applyExpenseEdit,
  createExpense,
  type Expense,
  type ExpenseInput,
} from '../lib/expense'
import {
  addExpense,
  getAllExpenses,
  removeExpense,
  updateExpense,
} from '../db/expenseStore'
import { expenseMessages } from '../lib/errorMessages'
import {
  useStoredCollection,
  type Store,
} from './useStoredCollection'

export interface BulkAddResult {
  added: number
  skipped: number
  errors: string[]
}

export interface UseExpenses {
  expenses: Expense[]
  loading: boolean
  error: string
  add: (input: ExpenseInput) => Promise<boolean>
  addMany: (inputs: ExpenseInput[]) => Promise<BulkAddResult>
  update: (existing: Expense, input: ExpenseInput) => Promise<boolean>
  remove: (id: string) => Promise<boolean>
  // Re-reads the store and updates state. Used by the backup-restore
  // flow (P5.C) to refresh after a multi-store bulk overwrite that
  // bypasses the hook's normal {validate → write → refresh} pipeline.
  refresh: () => Promise<void>
}

// Orchestrates expense persistence on top of `expenseStore`. The single-row
// CRUD is delegated to `useStoredCollection` — this wrapper only owns the
// bulk-add path (validation + write loop + one refresh + summary string),
// which is the one place the standard {validate → write → refresh} shape
// doesn't fit.
export function useExpenses(): UseExpenses {
  // Wrap the module-level store functions in thin closures rather than
  // capturing them directly. This keeps `vi.spyOn(expenseStore, 'removeExpense')
  // .mockRejectedValueOnce(...)` style tests working — the spy mutates the
  // module namespace, and these closures re-read the namespace on each call.
  const store = useMemo<Store<Expense>>(
    () => ({
      add: (e) => addExpense(e),
      getAll: () => getAllExpenses(),
      update: (e) => updateExpense(e),
      remove: (id) => removeExpense(id),
    }),
    [],
  )

  const collection = useStoredCollection<Expense, ExpenseInput>({
    store,
    validateAdd: createExpense,
    validateUpdate: applyExpenseEdit,
    messages: expenseMessages,
  })

  const { items, loading, error, add, update, remove, setError, refresh } =
    collection

  // Bulk-add many expenses. Each input is validated; failures are collected
  // in `errors` (with the same messages createExpense throws). Valid rows are
  // persisted in input order via addExpense; state is refreshed once after
  // all writes complete. Never throws — the result tells you what happened.
  const addMany = useCallback(
    async (inputs: ExpenseInput[]): Promise<BulkAddResult> => {
      if (inputs.length === 0) {
        return { added: 0, skipped: 0, errors: [] }
      }

      const errors: string[] = []
      const valid: Expense[] = []
      // Errors are message-only — addMany has no notion of source row numbers
      // (the caller maps inputs to CSV/UI lines). Adding "Row N:" here would
      // be off-by-N once a CSV parser has already dropped invalid rows.
      inputs.forEach((input) => {
        try {
          valid.push(createExpense(input))
        } catch (e) {
          errors.push(e instanceof Error ? e.message : 'Invalid expense.')
        }
      })

      let added = 0
      for (const expense of valid) {
        try {
          await addExpense(expense)
          added++
        } catch {
          errors.push(`Failed to add expense: ${expense.description}`)
        }
      }
      const skipped = inputs.length - added

      try {
        await refresh()
      } catch {
        // Best-effort refresh; surface as part of error summary below.
        errors.push('Failed to refresh expense list.')
      }

      if (errors.length > 0) {
        setError(`Imported ${added}. Skipped ${skipped}.`)
      } else {
        setError('')
      }

      return { added, skipped, errors }
    },
    [refresh, setError],
  )

  return {
    expenses: items,
    loading,
    error,
    add,
    addMany,
    update,
    remove,
    refresh,
  }
}
