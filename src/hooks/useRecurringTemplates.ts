import { useCallback, useMemo } from 'react'
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

export interface RecurringBulkAddResult {
  added: number
  skipped: number
  errors: string[]
}

export interface UseRecurringTemplates {
  templates: RecurringTemplate[]
  loading: boolean
  error: string
  add: (input: RecurringTemplateInput) => Promise<boolean>
  addMany: (
    inputs: RecurringTemplateInput[],
  ) => Promise<RecurringBulkAddResult>
  remove: (id: string) => Promise<boolean>
  // Re-reads the store. Used by the backup-restore flow (P5.C).
  refresh: () => Promise<void>
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

  const { items, loading, error, add, remove, setError, refresh } = collection

  // Bulk-add recurring templates. Mirrors `useExpenses.addMany`: each input
  // is validated; failures collect their validator messages. Valid rows are
  // persisted in input order; per-row persistence failures push a "Failed
  // to add recurring template: <description>" entry. One refresh after all
  // writes; refresh failure surfaces in the errors list. Never throws.
  const addMany = useCallback(
    async (
      inputs: RecurringTemplateInput[],
    ): Promise<RecurringBulkAddResult> => {
      if (inputs.length === 0) {
        return { added: 0, skipped: 0, errors: [] }
      }

      const errors: string[] = []
      const valid: RecurringTemplate[] = []
      inputs.forEach((input) => {
        try {
          valid.push(createRecurringTemplate(input))
        } catch (e) {
          errors.push(
            e instanceof Error ? e.message : 'Invalid recurring template.',
          )
        }
      })

      let added = 0
      for (const template of valid) {
        try {
          await addRecurringTemplate(template)
          added++
        } catch {
          errors.push(
            `Failed to add recurring template: ${template.description}`,
          )
        }
      }
      const skipped = inputs.length - added

      try {
        await refresh()
      } catch {
        errors.push('Failed to refresh recurring template list.')
      }

      if (errors.length > 0) {
        setError(`Imported ${added}. Skipped ${skipped}.`)
      } else {
        setError('')
      }

      return { added, skipped, errors }
    },
    [refresh, setError],
  )

  return {
    templates: items,
    loading,
    error,
    add,
    addMany,
    remove,
    refresh,
  }
}
