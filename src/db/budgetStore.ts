import type { MonthlyBudget } from '../lib/budget'
import { withStore } from './db'

const STORE_NAME = 'monthlyBudgets'

export async function setBudget(budget: MonthlyBudget): Promise<void> {
  await withStore(STORE_NAME, 'readwrite', (store) => store.put(budget))
}

export function getBudget(month: string): Promise<MonthlyBudget | undefined> {
  return withStore<MonthlyBudget | undefined>(STORE_NAME, 'readonly', (store) =>
    store.get(month),
  )
}

export function getAllBudgets(): Promise<MonthlyBudget[]> {
  return withStore<MonthlyBudget[]>(STORE_NAME, 'readonly', (store) => store.getAll())
}

export async function removeBudget(month: string): Promise<void> {
  await withStore(STORE_NAME, 'readwrite', (store) => store.delete(month))
}
