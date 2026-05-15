import { useMemo } from 'react'
import {
  createRecurringTemplate,
  type RecurringTemplate,
  type RecurringTemplateInput,
} from '../lib/recurring'
import {
  addRecurringTemplate,
  getAllRecurringTemplates,
  removeRecurringTemplate,
} from '../db/recurringTemplateStore'
import { recurringTemplateMessages } from '../lib/errorMessages'
import {
  useStoredCollection,
  type Store,
} from './useStoredCollection'

export interface UseRecurringTemplates {
  templates: RecurringTemplate[]
  loading: boolean
  error: string
  add: (input: RecurringTemplateInput) => Promise<boolean>
  remove: (id: string) => Promise<boolean>
}

// Persistence-layer hook for recurring templates. Simplest of the four —
// no update path, just add + remove. Rollover orchestration is NOT here —
// it sits in App.tsx where the expense hook is also available. The hook
// stays pure CRUD so it composes cleanly regardless of whether rollover
// is wired in.
export function useRecurringTemplates(): UseRecurringTemplates {
  // Closures rather than direct references so vi.spyOn on the store module
  // works in tests (the spy mutates the namespace; our closures re-resolve
  // through the live ESM binding on each call).
  const store = useMemo<Store<RecurringTemplate>>(
    () => ({
      add: (t) => addRecurringTemplate(t),
      getAll: () => getAllRecurringTemplates(),
      remove: (id) => removeRecurringTemplate(id),
    }),
    [],
  )

  const collection = useStoredCollection<
    RecurringTemplate,
    RecurringTemplateInput
  >({
    store,
    validateAdd: createRecurringTemplate,
    messages: recurringTemplateMessages,
  })

  const { items, loading, error, add, remove } = collection

  return {
    templates: items,
    loading,
    error,
    add,
    remove,
  }
}
