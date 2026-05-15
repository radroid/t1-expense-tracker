import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import type { CategoryBudget } from '../lib/categoryBudget'
import { categoryBudgetId } from '../lib/categoryBudget'
import {
  getAllCategoryBudgets,
  getCategoryBudget,
  removeCategoryBudget,
  setCategoryBudget,
} from './categoryBudgetStore'

function makeBudget(overrides: Partial<CategoryBudget> = {}): CategoryBudget {
  const month = overrides.month ?? '2026-05'
  const categoryId = overrides.categoryId ?? 'cat-food'
  return {
    id: categoryBudgetId(month, categoryId),
    month,
    categoryId,
    amount: 200,
    ...overrides,
  }
}

describe('categoryBudgetStore', () => {
  beforeEach(async () => {
    await new Promise<void>((resolve, reject) => {
      const req = indexedDB.deleteDatabase('expense-tracker')
      req.onsuccess = () => resolve()
      req.onerror = () => reject(req.error)
      req.onblocked = () =>
        reject(new Error('deleteDatabase blocked — a connection was left open'))
    })
  })

  it('set then getCategoryBudget returns the budget', async () => {
    const b = makeBudget()
    await setCategoryBudget(b)
    const got = await getCategoryBudget('2026-05', 'cat-food')
    expect(got).toEqual(b)
  })

  it('getAllCategoryBudgets returns all set budgets', async () => {
    const b1 = makeBudget({ month: '2026-05', categoryId: 'cat-food' })
    const b2 = makeBudget({
      month: '2026-05',
      categoryId: 'cat-rent',
      amount: 1500,
    })
    await setCategoryBudget(b1)
    await setCategoryBudget(b2)
    const all = await getAllCategoryBudgets()
    expect(all).toHaveLength(2)
    expect(all).toEqual(expect.arrayContaining([b1, b2]))
  })

  it('setCategoryBudget twice for the same (month, categoryId) overwrites', async () => {
    await setCategoryBudget(
      makeBudget({ month: '2026-05', categoryId: 'cat-food', amount: 200 }),
    )
    await setCategoryBudget(
      makeBudget({ month: '2026-05', categoryId: 'cat-food', amount: 500 }),
    )
    const got = await getCategoryBudget('2026-05', 'cat-food')
    expect(got?.amount).toBe(500)
    const all = await getAllCategoryBudgets()
    expect(all).toHaveLength(1)
  })

  it('removeCategoryBudget by composite id deletes the row', async () => {
    const b1 = makeBudget({ month: '2026-05', categoryId: 'cat-food' })
    const b2 = makeBudget({ month: '2026-05', categoryId: 'cat-rent' })
    await setCategoryBudget(b1)
    await setCategoryBudget(b2)
    await removeCategoryBudget(b1.id)
    const all = await getAllCategoryBudgets()
    expect(all).toEqual([b2])
  })

  it('getCategoryBudget on unknown (month, categoryId) returns undefined', async () => {
    const got = await getCategoryBudget('2026-05', 'never')
    expect(got).toBeUndefined()
  })

  it('getAllCategoryBudgets on empty store returns []', async () => {
    const all = await getAllCategoryBudgets()
    expect(all).toEqual([])
  })

  it('rows for different months are independent', async () => {
    await setCategoryBudget(
      makeBudget({ month: '2026-05', categoryId: 'cat-food', amount: 200 }),
    )
    await setCategoryBudget(
      makeBudget({ month: '2026-06', categoryId: 'cat-food', amount: 250 }),
    )
    const all = await getAllCategoryBudgets()
    expect(all).toHaveLength(2)
    expect(await getCategoryBudget('2026-05', 'cat-food')).toMatchObject({
      amount: 200,
    })
    expect(await getCategoryBudget('2026-06', 'cat-food')).toMatchObject({
      amount: 250,
    })
  })
})
