import type { MonthlyBudget } from '../lib/budget'
import { makeStore } from './store'

const store = makeStore<MonthlyBudget>('monthlyBudgets')

export const setBudget = (b: MonthlyBudget): Promise<void> => store.put(b)
export const getBudget = (month: string): Promise<MonthlyBudget | undefined> =>
  store.get(month)
export const getAllBudgets = (): Promise<MonthlyBudget[]> => store.getAll()
export const removeBudget = (month: string): Promise<void> => store.remove(month)
