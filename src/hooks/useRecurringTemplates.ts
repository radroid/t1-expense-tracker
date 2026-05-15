import { useEffect, useState } from 'react'
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

export interface UseRecurringTemplates {
  templates: RecurringTemplate[]
  loading: boolean
  error: string
  add: (input: RecurringTemplateInput) => Promise<boolean>
  remove: (id: string) => Promise<boolean>
}

// Persistence-layer hook for recurring templates. Mirrors useCategories shape:
// boolean-success returns let callers chain follow-ups (e.g. closing a form);
// errors are last-error strings the consumer surfaces in its own alert slot.
//
// Rollover orchestration is NOT here — it sits in App.tsx where the expense
// hook is also available. The hook stays pure CRUD so it composes cleanly
// regardless of whether rollover is wired in.
export function useRecurringTemplates(): UseRecurringTemplates {
  const [templates, setTemplates] = useState<RecurringTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    getAllRecurringTemplates()
      .then(setTemplates)
      .catch(() => setError('Failed to load recurring templates.'))
      .finally(() => setLoading(false))
  }, [])

  async function add(input: RecurringTemplateInput): Promise<boolean> {
    let template: RecurringTemplate
    try {
      template = createRecurringTemplate(input)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Invalid template.')
      return false
    }
    try {
      await addRecurringTemplate(template)
      setTemplates(await getAllRecurringTemplates())
      setError('')
      return true
    } catch {
      setError('Failed to add recurring template.')
      return false
    }
  }

  async function remove(id: string): Promise<boolean> {
    try {
      await removeRecurringTemplate(id)
      setTemplates(await getAllRecurringTemplates())
      setError('')
      return true
    } catch {
      setError('Failed to delete recurring template.')
      return false
    }
  }

  return { templates, loading, error, add, remove }
}
