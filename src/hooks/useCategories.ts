import { useCallback, useMemo } from 'react'
import {
  createCategory,
  type Category,
  type CategoryInput,
} from '../lib/category'
import {
  addCategory,
  getAllCategories,
  removeCategory,
  seedDefaultCategories,
  updateCategory,
} from '../db/categoryStore'
import { categoryMessages } from '../lib/errorMessages'
import {
  useStoredCollection,
  type Store,
} from './useStoredCollection'

export interface UseCategories {
  categories: Category[]
  loading: boolean
  error: string
  add: (input: CategoryInput) => Promise<boolean>
  rename: (id: string, name: string) => Promise<boolean>
  remove: (id: string) => Promise<boolean>
}

// Validator used by the generic's update path. Categories are renamed by id
// from the UI; we adapt that to the generic's (existing, input) shape by
// passing the existing category through unchanged and substituting only name.
const validateCategoryRename = (
  existing: Category,
  input: CategoryInput,
): Category => ({
  ...existing,
  name: input.name,
})

// Persistence-layer hook for categories. On mount it seeds defaults if the
// store is empty (via `useStoredCollection`'s `bootstrap`) and returns the
// full list. `rename(id, name)` is the domain-shaped wrapper around the
// generic's `update(existing, input)`.
export function useCategories(): UseCategories {
  // Closures rather than direct references so vi.spyOn on the store module
  // works in tests (the spy mutates the namespace; our closures re-resolve
  // through the live ESM binding on each call).
  const store = useMemo<Store<Category>>(
    () => ({
      add: (c) => addCategory(c),
      getAll: () => getAllCategories(),
      update: (c) => updateCategory(c),
      remove: (id) => removeCategory(id),
    }),
    [],
  )

  const collection = useStoredCollection<Category, CategoryInput>({
    store,
    validateAdd: createCategory,
    validateUpdate: validateCategoryRename,
    messages: categoryMessages,
    // `seedDefaultCategories` returns the seeded list, but the generic's
    // own getAll() runs right after — so we discard the seed's return and
    // let getAll() drive state. Net effect matches the pre-refactor flow.
    bootstrap: async () => {
      await seedDefaultCategories()
    },
  })

  const { items, loading, error, add, update, remove, setError } = collection

  const rename = useCallback(
    async (id: string, name: string): Promise<boolean> => {
      const existing = items.find((c) => c.id === id)
      if (!existing) {
        setError('Category not found.')
        return false
      }
      return update(existing, { ...existing, name })
    },
    [items, update, setError],
  )

  return {
    categories: items,
    loading,
    error,
    add,
    rename,
    remove,
  }
}
