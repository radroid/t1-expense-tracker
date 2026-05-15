import { useEffect, useState } from 'react'
import { createMonthlyBudget, type MonthlyBudget } from '../lib/budget'
import {
  getAllBudgets,
  removeBudget,
  setBudget,
} from '../db/budgetStore'

export interface UseMonthlyBudgets {
  budgets: MonthlyBudget[]
  loading: boolean
  error: string
  // Upserts the budget for `month`. Returns true on success.
  set: (month: string, amount: number) => Promise<boolean>
  remove: (month: string) => Promise<boolean>
  // Convenience: returns the budget for the given month, or undefined.
  getFor: (month: string) => MonthlyBudget | undefined
}

// Orchestrates monthly-budget persistence on top of `budgetStore`. Mirrors
// `useExpenses` / `useCategories` in shape — validation → store write →
// refresh, surfacing a last-error string and boolean success.
export function useMonthlyBudgets(): UseMonthlyBudgets {
  const [budgets, setBudgets] = useState<MonthlyBudget[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    getAllBudgets()
      .then(setBudgets)
      .catch(() => setError('Failed to load budgets.'))
      .finally(() => setLoading(false))
  }, [])

  async function set(month: string, amount: number): Promise<boolean> {
    let budget: MonthlyBudget
    try {
      budget = createMonthlyBudget({ month, amount })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Invalid budget.')
      return false
    }
    try {
      await setBudget(budget)
      setBudgets(await getAllBudgets())
      setError('')
      return true
    } catch {
      setError('Failed to save budget.')
      return false
    }
  }

  async function remove(month: string): Promise<boolean> {
    try {
      await removeBudget(month)
      setBudgets(await getAllBudgets())
      setError('')
      return true
    } catch {
      setError('Failed to delete budget.')
      return false
    }
  }

  function getFor(month: string): MonthlyBudget | undefined {
    return budgets.find((b) => b.month === month)
  }

  return { budgets, loading, error, set, remove, getFor }
}
