import { useEffect, useState } from 'react'
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

export interface UseCategories {
  categories: Category[]
  loading: boolean
  error: string
  add: (input: CategoryInput) => Promise<boolean>
  rename: (id: string, name: string) => Promise<boolean>
  remove: (id: string) => Promise<boolean>
}

// Orchestrates category persistence. On mount it seeds defaults if the
// store is empty and returns the full list. Same boolean-success contract
// as useExpenses so App can chain follow-ups (e.g. resetting the filter
// when the filtered-on category is deleted).
export function useCategories(): UseCategories {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    seedDefaultCategories()
      .then(setCategories)
      .catch(() => setError('Failed to load categories.'))
      .finally(() => setLoading(false))
  }, [])

  async function add(input: CategoryInput): Promise<boolean> {
    let category: Category
    try {
      category = createCategory(input)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Invalid category.')
      return false
    }
    try {
      await addCategory(category)
      setCategories(await getAllCategories())
      setError('')
      return true
    } catch {
      setError('Failed to add category.')
      return false
    }
  }

  async function rename(id: string, name: string): Promise<boolean> {
    const existing = categories.find((c) => c.id === id)
    if (!existing) {
      setError('Category not found.')
      return false
    }
    try {
      await updateCategory({ ...existing, name })
      setCategories(await getAllCategories())
      setError('')
      return true
    } catch {
      setError('Failed to rename category.')
      return false
    }
  }

  async function remove(id: string): Promise<boolean> {
    try {
      await removeCategory(id)
      setCategories(await getAllCategories())
      setError('')
      return true
    } catch {
      setError('Failed to delete category.')
      return false
    }
  }

  return { categories, loading, error, add, rename, remove }
}
