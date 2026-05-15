import { describe, it, expect } from 'vitest'
import { filterExpensesByCategory } from './expenseFilter'
import type { Expense } from './expense'
import type { Category } from './category'

const food: Category = { id: 'cat-food', name: 'Food', color: '#ff8800' }
const transport: Category = { id: 'cat-trans', name: 'Transport', color: '#0088ff' }

const e = (id: string, amount: number, categoryId?: string): Expense => ({
  id,
  amount,
  description: `expense ${id}`,
  date: '2026-05-15',
  categoryId,
})

describe('filterExpensesByCategory', () => {
  it('returns all expenses when filter is "all"', () => {
    const expenses = [e('1', 10, food.id), e('2', 20), e('3', 30, 'orphan-id')]
    expect(filterExpensesByCategory(expenses, 'all', [food, transport])).toEqual(
      expenses,
    )
  })

  it('returns only matching-category expenses when filter is a categoryId', () => {
    const expenses = [
      e('1', 10, food.id),
      e('2', 20, transport.id),
      e('3', 30, food.id),
    ]
    expect(
      filterExpensesByCategory(expenses, food.id, [food, transport]),
    ).toEqual([expenses[0], expenses[2]])
  })

  it('buckets undefined categoryId + orphans together when filter is "uncategorized"', () => {
    const expenses = [
      e('1', 10, food.id),
      e('2', 20),
      e('3', 30, 'deleted-cat-id'),
    ]
    expect(
      filterExpensesByCategory(expenses, 'uncategorized', [food, transport]),
    ).toEqual([expenses[1], expenses[2]])
  })

  it('does not mutate the input array', () => {
    const expenses = [e('1', 10, food.id), e('2', 20, transport.id)]
    const snapshot = [...expenses]
    filterExpensesByCategory(expenses, food.id, [food, transport])
    expect(expenses).toEqual(snapshot)
  })

  it('returns an empty array when no expenses match the categoryId', () => {
    const expenses = [e('1', 10, food.id)]
    expect(
      filterExpensesByCategory(expenses, transport.id, [food, transport]),
    ).toEqual([])
  })
})
