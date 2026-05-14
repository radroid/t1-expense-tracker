import type { Category } from '../lib/category'
import { createCategory, DEFAULT_CATEGORIES } from '../lib/category'
import { withStore } from './db'

const STORE_NAME = 'categories'

export async function addCategory(c: Category): Promise<void> {
  await withStore(STORE_NAME, 'readwrite', (store) => store.add(c))
}

export function getAllCategories(): Promise<Category[]> {
  return withStore<Category[]>(STORE_NAME, 'readonly', (store) => store.getAll())
}

export async function updateCategory(c: Category): Promise<void> {
  await withStore(STORE_NAME, 'readwrite', (store) => store.put(c))
}

export async function removeCategory(id: string): Promise<void> {
  await withStore(STORE_NAME, 'readwrite', (store) => store.delete(id))
}

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
