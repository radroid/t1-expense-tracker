import type { RecurringTemplate } from '../lib/recurring'
import { makeStore } from './store'

const store = makeStore<RecurringTemplate>('recurringTemplates')

export const addRecurringTemplate = (t: RecurringTemplate): Promise<void> =>
  store.add(t)
export const putRecurringTemplate = (t: RecurringTemplate): Promise<void> =>
  store.put(t)
export const getAllRecurringTemplates = (): Promise<RecurringTemplate[]> =>
  store.getAll()
export const removeRecurringTemplate = (id: string): Promise<void> =>
  store.remove(id)
