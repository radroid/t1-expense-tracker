import type { Expense } from '../lib/expense';
import { withStore } from './db';

const STORE_NAME = 'expenses';

export async function addExpense(e: Expense): Promise<void> {
  await withStore(STORE_NAME, 'readwrite', (store) => store.add(e));
}

export function getAllExpenses(): Promise<Expense[]> {
  return withStore<Expense[]>(STORE_NAME, 'readonly', (store) => store.getAll());
}

export async function updateExpense(e: Expense): Promise<void> {
  await withStore(STORE_NAME, 'readwrite', (store) => store.put(e));
}

export async function removeExpense(id: string): Promise<void> {
  await withStore(STORE_NAME, 'readwrite', (store) => store.delete(id));
}
