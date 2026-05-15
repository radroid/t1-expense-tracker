import { useCallback, useEffect, useState } from 'react'

// Generic CRUD hook over an IndexedDB store wrapper. Every domain hook in
// this codebase (expenses, categories, budgets, recurring templates) was
// independently re-implementing the same shape:
//
//   - load on mount with a "Failed to load X" fallback
//   - validate input, then write, then refresh list, then clear error
//   - on validation throw: surface the Error's own message (domain text)
//   - on store throw: surface a generic "Failed to X" message
//
// This module captures that shape once. Domain hooks become thin wrappers
// that bind a Store + validators + error-message bundle and then expose
// their domain-shaped surface (rename, set, addMany, etc.) on top.

export interface Store<T, K = string> {
  add: (entity: T) => Promise<void>
  getAll: () => Promise<T[]>
  // `update` is optional because not every domain has one — `useMonthlyBudgets`
  // uses a single `put`/upsert (mapped to `add` here), and
  // `useRecurringTemplates` has no update at all.
  update?: (entity: T) => Promise<void>
  remove: (key: K) => Promise<void>
}

export interface StoredCollectionMessages {
  load: string
  add: string
  // Required only if the wrapper exposes update().
  update?: string
  remove: string
}

export interface UseStoredCollectionOptions<T, TInput, K = string> {
  store: Store<T, K>
  validateAdd: (input: TInput) => T
  validateUpdate?: (existing: T, input: TInput) => T
  messages: StoredCollectionMessages
  // One-shot bootstrap before the initial getAll. Used by useCategories to
  // seed defaults on first run. Runs inside the same effect so the initial
  // loading flag stays true through the seed + load.
  bootstrap?: () => Promise<void>
}

export interface UseStoredCollection<T, TInput, K = string> {
  items: T[]
  loading: boolean
  error: string
  add: (input: TInput) => Promise<boolean>
  update: (existing: T, input: TInput) => Promise<boolean>
  remove: (key: K) => Promise<boolean>
  // Escape hatches for wrappers that perform work outside the standard
  // {validate → write → refresh} pipeline (e.g. `useExpenses.addMany` which
  // batches writes and reports a summary, or any flow that needs to clear
  // the last-error without going through a mutation).
  setError: (msg: string) => void
  refresh: () => Promise<void>
}

export function useStoredCollection<T, TInput, K = string>(
  options: UseStoredCollectionOptions<T, TInput, K>,
): UseStoredCollection<T, TInput, K> {
  const { store, validateAdd, validateUpdate, messages, bootstrap } = options

  const [items, setItems] = useState<T[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // The hook's contract is "load once on mount, then mutate-in-place" —
  // matching the pre-refactor hooks. Domain wrappers wrap their store
  // methods in stable useMemo'd closures, so capturing store/bootstrap/
  // messages.load in the effect closure is safe; eslint's exhaustive-deps
  // is intentionally not exhaustive here because re-running the load effect
  // on every options change would reset state mid-session.
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        if (bootstrap) {
          await bootstrap()
        }
        const all = await store.getAll()
        if (!cancelled) setItems(all)
      } catch {
        if (!cancelled) setError(messages.load)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const refresh = useCallback(async () => {
    setItems(await store.getAll())
  }, [store])

  const add = useCallback(
    async (input: TInput): Promise<boolean> => {
      let entity: T
      try {
        entity = validateAdd(input)
      } catch (e) {
        setError(e instanceof Error ? e.message : messages.add)
        return false
      }
      try {
        await store.add(entity)
        setItems(await store.getAll())
        setError('')
        return true
      } catch {
        setError(messages.add)
        return false
      }
    },
    [store, validateAdd, messages.add],
  )

  const update = useCallback(
    async (existing: T, input: TInput): Promise<boolean> => {
      if (!validateUpdate || !store.update) {
        // Wrappers that don't enable update should not call this — but
        // surface a sensible last-error rather than throw, so behavior
        // matches "store rejected" rather than crashing the consumer.
        setError(messages.update ?? messages.add)
        return false
      }
      let next: T
      try {
        next = validateUpdate(existing, input)
      } catch (e) {
        setError(e instanceof Error ? e.message : (messages.update ?? messages.add))
        return false
      }
      try {
        await store.update(next)
        setItems(await store.getAll())
        setError('')
        return true
      } catch {
        setError(messages.update ?? messages.add)
        return false
      }
    },
    [store, validateUpdate, messages.update, messages.add],
  )

  const remove = useCallback(
    async (key: K): Promise<boolean> => {
      try {
        await store.remove(key)
        setItems(await store.getAll())
        setError('')
        return true
      } catch {
        setError(messages.remove)
        return false
      }
    },
    [store, messages.remove],
  )

  return { items, loading, error, add, update, remove, setError, refresh }
}
