import type { Category } from '../lib/category'
import { createCategory, DEFAULT_CATEGORIES } from '../lib/category'
import { makeStore } from './store'

const store = makeStore<Category>('categories')

export const addCategory = (c: Category): Promise<void> => store.add(c)
export const getAllCategories = (): Promise<Category[]> => store.getAll()
export const updateCategory = (c: Category): Promise<void> => store.put(c)
export const removeCategory = (id: string): Promise<void> => store.remove(id)

export async function seedDefaultCategories(): Promise<Category[]> {
  const existing = await getAllCategories()
  if (existing.length > 0) {
    return existing
  }

  const created = DEFAULT_CATEGORIES.map((input) => createCategory(input))
  for (const category of created) {
    await addCategory(category)
  }
  return getAllCategories()
}
