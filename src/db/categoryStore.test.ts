import { beforeEach, describe, expect, it } from 'vitest'
import type { Category } from '../lib/category'
import {
  addCategory,
  getAllCategories,
  removeCategory,
  seedDefaultCategories,
  updateCategory,
} from './categoryStore'

function makeCategory(overrides: Partial<Category> = {}): Category {
  return {
    id: 'c1',
    name: 'Food',
    color: '#ff0000',
    ...overrides,
  }
}

describe('categoryStore', () => {
  beforeEach(async () => {
    await new Promise<void>((resolve, reject) => {
      const req = indexedDB.deleteDatabase('expense-tracker')
      req.onsuccess = () => resolve()
      req.onerror = () => reject(req.error)
      req.onblocked = () =>
        reject(new Error('deleteDatabase blocked — a connection was left open'))
    })
  })

  it('add then getAll returns the category', async () => {
    const c = makeCategory()
    await addCategory(c)
    const all = await getAllCategories()
    expect(all).toEqual([c])
  })

  it('add multiple then getAll returns all', async () => {
    const c1 = makeCategory({ id: 'c1' })
    const c2 = makeCategory({ id: 'c2', name: 'Transport', color: '#00ff00' })
    await addCategory(c1)
    await addCategory(c2)
    const all = await getAllCategories()
    expect(all).toHaveLength(2)
    expect(all).toEqual(expect.arrayContaining([c1, c2]))
  })

  it('update reflects the change in getAll', async () => {
    const c = makeCategory()
    await addCategory(c)
    const updated = { ...c, name: 'Groceries', color: '#0000ff' }
    await updateCategory(updated)
    const all = await getAllCategories()
    expect(all).toEqual([updated])
  })

  it('remove deletes the category', async () => {
    const c1 = makeCategory({ id: 'c1' })
    const c2 = makeCategory({ id: 'c2' })
    await addCategory(c1)
    await addCategory(c2)
    await removeCategory('c1')
    const all = await getAllCategories()
    expect(all).toEqual([c2])
  })

  it('getAll on empty store returns []', async () => {
    const all = await getAllCategories()
    expect(all).toEqual([])
  })

  it('seedDefaultCategories on empty store returns + persists defaults', async () => {
    const seeded = await seedDefaultCategories()
    expect(seeded.length).toBeGreaterThan(0)
    const all = await getAllCategories()
    expect(all).toHaveLength(seeded.length)
    expect(all).toEqual(expect.arrayContaining(seeded))
  })

  it('seedDefaultCategories is a no-op when store is non-empty', async () => {
    const c = makeCategory()
    await addCategory(c)
    const result = await seedDefaultCategories()
    expect(result).toEqual([c])
    const all = await getAllCategories()
    expect(all).toEqual([c])
  })
})
