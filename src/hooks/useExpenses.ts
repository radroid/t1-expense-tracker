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

export interface UseExpenses {
  expenses: Expense[]
  loading: boolean
  error: string
  add: (input: ExpenseInput) => Promise<boolean>
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

  return { expenses, loading, error, add, update, remove }
}
