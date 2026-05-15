import type { RecurringTemplate } from '../lib/recurring'
import { withStore } from './db'

const STORE_NAME = 'recurringTemplates'

export async function addRecurringTemplate(t: RecurringTemplate): Promise<void> {
  await withStore(STORE_NAME, 'readwrite', (store) => store.add(t))
}

export function getAllRecurringTemplates(): Promise<RecurringTemplate[]> {
  return withStore<RecurringTemplate[]>(STORE_NAME, 'readonly', (store) =>
    store.getAll(),
  )
}

export async function removeRecurringTemplate(id: string): Promise<void> {
  await withStore(STORE_NAME, 'readwrite', (store) => store.delete(id))
}
