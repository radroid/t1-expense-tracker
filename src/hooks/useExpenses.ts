import { useEffect, useState } from 'react'
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
}

// Orchestrates expense persistence on top of `expenseStore`. Each mutation
// runs the validation → store write → refresh sequence and surfaces a single
// last-error string; callers see boolean success/failure so they can chain
// view-state transitions (closing an edit form, resetting a filter, etc.).
export function useExpenses(): UseExpenses {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    getAllExpenses()
      .then(setExpenses)
      .catch(() => setError('Failed to load expenses.'))
      .finally(() => setLoading(false))
  }, [])

  async function add(input: ExpenseInput): Promise<boolean> {
    let expense: Expense
    try {
      expense = createExpense(input)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Invalid expense.')
      return false
    }
    try {
      await addExpense(expense)
      setExpenses(await getAllExpenses())
      setError('')
      return true
    } catch {
      setError('Failed to add expense.')
      return false
    }
  }

  // Bulk-add many expenses. Each input is validated; failures are collected
  // in `errors` (with the same messages createExpense throws). Valid rows are
  // persisted in input order via addExpense; state is refreshed once after
  // all writes complete. Never throws — the result tells you what happened.
  async function addMany(inputs: ExpenseInput[]): Promise<BulkAddResult> {
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
      setExpenses(await getAllExpenses())
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
  }

  async function update(
    existing: Expense,
    input: ExpenseInput,
  ): Promise<boolean> {
    let updated: Expense
    try {
      updated = applyExpenseEdit(existing, input)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Invalid expense.')
      return false
    }
    try {
      await updateExpense(updated)
      setExpenses(await getAllExpenses())
      setError('')
      return true
    } catch {
      setError('Failed to save changes.')
      return false
    }
  }

  async function remove(id: string): Promise<boolean> {
    try {
      await removeExpense(id)
      setExpenses(await getAllExpenses())
      setError('')
      return true
    } catch {
      setError('Failed to delete expense.')
      return false
    }
  }

  return { expenses, loading, error, add, addMany, update, remove }
}
