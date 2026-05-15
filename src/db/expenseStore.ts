import type { Expense } from '../lib/expense'
import { makeStore } from './store'

const store = makeStore<Expense>('expenses')

export const addExpense = (e: Expense): Promise<void> => store.add(e)
export const getAllExpenses = (): Promise<Expense[]> => store.getAll()
export const updateExpense = (e: Expense): Promise<void> => store.put(e)
export const removeExpense = (id: string): Promise<void> => store.remove(id)
