import { describe, it, expect } from 'vitest'
import type { Expense } from './expense'
import type { Category } from './category'
import { spendingByCategory } from './categoryTotals'

function expense(
  amount: number,
  id: string,
  categoryId?: string,
): Expense {
  const e: Expense = { id, amount, description: 'test', date: '2026-01-01' }
  if (categoryId !== undefined) e.categoryId = categoryId
  return e
}

function category(id: string, name: string, color = '#000000'): Category {
  return { id, name, color }
}

describe('spendingByCategory', () => {
  it('returns [] for empty expenses', () => {
    expect(spendingByCategory([], [])).toEqual([])
    expect(spendingByCategory([], [category('c1', 'Food')])).toEqual([])
  })

  it('returns one entry for a single expense with a known categoryId', () => {
    const food = category('c1', 'Food', '#ef4444')
    const result = spendingByCategory(
      [expense(10, 'e1', 'c1')],
      [food],
    )
    expect(result).toHaveLength(1)
    expect(result[0]).toEqual({ category: food, total: 10 })
  })

  it('sums multiple expenses in the same category', () => {
    const food = category('c1', 'Food')
    const result = spendingByCategory(
      [
        expense(10, 'e1', 'c1'),
        expense(2.5, 'e2', 'c1'),
        expense(100, 'e3', 'c1'),
      ],
      [food],
    )
    expect(result).toHaveLength(1)
    expect(result[0].category).toEqual(food)
    expect(result[0].total).toBeCloseTo(112.5)
  })

  it('produces one entry per category present with correct sums (mixed)', () => {
    const food = category('c1', 'Food')
    const transport = category('c2', 'Transport')
    const result = spendingByCategory(
      [
        expense(10, 'e1', 'c1'),
        expense(20, 'e2', 'c1'),
        expense(5, 'e3', 'c2'),
      ],
      [food, transport],
    )
    expect(result).toHaveLength(2)
    const foodEntry = result.find((r) => r.category?.id === 'c1')
    const transportEntry = result.find((r) => r.category?.id === 'c2')
    expect(foodEntry).toEqual({ category: food, total: 30 })
    expect(transportEntry).toEqual({ category: transport, total: 5 })
  })

  it('buckets expenses with no categoryId into the null bucket', () => {
    const food = category('c1', 'Food')
    const result = spendingByCategory(
      [expense(7, 'e1'), expense(3, 'e2')],
      [food],
    )
    expect(result).toHaveLength(1)
    expect(result[0]).toEqual({ category: null, total: 10 })
  })

  it('buckets expenses with an orphan categoryId into the null bucket', () => {
    const food = category('c1', 'Food')
    const result = spendingByCategory(
      [expense(8, 'e1', 'missing-cat')],
      [food],
    )
    expect(result).toHaveLength(1)
    expect(result[0]).toEqual({ category: null, total: 8 })
  })

  it('combines null and orphan expenses into a single null bucket', () => {
    const food = category('c1', 'Food')
    const result = spendingByCategory(
      [
        expense(10, 'e1', 'c1'),
        expense(2, 'e2'),
        expense(3, 'e3', 'missing-cat'),
        expense(5, 'e4', 'another-missing'),
      ],
      [food],
    )
    expect(result).toHaveLength(2)
    const foodEntry = result.find((r) => r.category?.id === 'c1')
    const nullEntry = result.find((r) => r.category === null)
    expect(foodEntry).toEqual({ category: food, total: 10 })
    expect(nullEntry).toEqual({ category: null, total: 10 })
  })

  it('omits categories that have no expenses (no zero-total rows)', () => {
    const food = category('c1', 'Food')
    const transport = category('c2', 'Transport')
    const result = spendingByCategory(
      [expense(10, 'e1', 'c1')],
      [food, transport],
    )
    expect(result).toHaveLength(1)
    expect(result.some((r) => r.category?.id === 'c2')).toBe(false)
  })

  it('does not mutate inputs', () => {
    const food = category('c1', 'Food')
    const transport = category('c2', 'Transport')
    const expenses = [
      expense(10, 'e1', 'c1'),
      expense(5, 'e2', 'c2'),
      expense(3, 'e3'),
    ]
    const categories = [food, transport]
    const expensesSnapshot = [...expenses]
    const categoriesSnapshot = [...categories]
    spendingByCategory(expenses, categories)
    expect(expenses).toHaveLength(expensesSnapshot.length)
    expect(categories).toHaveLength(categoriesSnapshot.length)
    expect(expenses).toEqual(expensesSnapshot)
    expect(categories).toEqual(categoriesSnapshot)
  })
})
