import { describe, it, expect } from 'vitest'
import {
  filterExpensesByCategory,
  filterExpensesByMonth,
} from './expenseFilter'
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

describe('filterExpensesByMonth', () => {
  const mk = (id: string, date: string): Expense => ({
    id,
    amount: 10,
    description: `expense ${id}`,
    date,
  })

  it('returns expenses whose date is in the given YYYY-MM', () => {
    const expenses = [
      mk('1', '2026-05-15'),
      mk('2', '2026-04-30'),
      mk('3', '2026-05-01'),
    ]
    expect(filterExpensesByMonth(expenses, '2026-05')).toEqual([
      expenses[0],
      expenses[2],
    ])
  })

  it('returns an empty array when no expenses match', () => {
    expect(
      filterExpensesByMonth([mk('1', '2026-05-15')], '2026-04'),
    ).toEqual([])
  })

  it('does not mutate the input array', () => {
    const expenses = [mk('1', '2026-05-15'), mk('2', '2026-04-30')]
    const snapshot = [...expenses]
    filterExpensesByMonth(expenses, '2026-05')
    expect(expenses).toEqual(snapshot)
  })
})
