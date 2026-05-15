import { renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { useVisibleExpenses } from './useVisibleExpenses'
import type { Expense } from '../lib/expense'
import type { Category } from '../lib/category'

const food: Category = { id: 'cat-food', name: 'Food', color: '#ff8800' }
const transport: Category = {
  id: 'cat-trans',
  name: 'Transport',
  color: '#0088ff',
}

const e = (id: string, date: string, categoryId?: string): Expense => ({
  id,
  amount: 10,
  description: `expense ${id}`,
  date,
  categoryId,
})

describe('useVisibleExpenses', () => {
  it('returns monthlyExpenses (month filter only) and visibleExpenses (month + category)', () => {
    const expenses = [
      e('1', '2026-05-10', food.id),
      e('2', '2026-05-20', transport.id),
      e('3', '2026-04-15', food.id),
    ]
    const { result } = renderHook(() =>
      useVisibleExpenses({
        expenses,
        selectedMonth: '2026-05',
        categoryFilter: 'all',
        categories: [food, transport],
      }),
    )

    expect(result.current.monthlyExpenses).toEqual([expenses[0], expenses[1]])
    expect(result.current.visibleExpenses).toEqual([expenses[0], expenses[1]])
  })

  it('narrows visibleExpenses by category while monthlyExpenses stays month-scoped', () => {
    const expenses = [
      e('1', '2026-05-10', food.id),
      e('2', '2026-05-20', transport.id),
      e('3', '2026-04-15', food.id),
    ]
    const { result } = renderHook(() =>
      useVisibleExpenses({
        expenses,
        selectedMonth: '2026-05',
        categoryFilter: food.id,
        categories: [food, transport],
      }),
    )

    expect(result.current.monthlyExpenses).toEqual([expenses[0], expenses[1]])
    expect(result.current.visibleExpenses).toEqual([expenses[0]])
  })

  it('returns stable references when inputs are unchanged (memoization)', () => {
    const expenses = [e('1', '2026-05-10', food.id)]
    const { result, rerender } = renderHook(
      ({ filter }: { filter: 'all' | string }) =>
        useVisibleExpenses({
          expenses,
          selectedMonth: '2026-05',
          categoryFilter: filter,
          categories: [food],
        }),
      { initialProps: { filter: 'all' } },
    )
    const firstVisible = result.current.visibleExpenses
    const firstMonthly = result.current.monthlyExpenses

    rerender({ filter: 'all' })
    expect(result.current.visibleExpenses).toBe(firstVisible)
    expect(result.current.monthlyExpenses).toBe(firstMonthly)
  })

  it('recomputes monthlyExpenses only when month/expenses change, not when categoryFilter changes', () => {
    const expenses = [
      e('1', '2026-05-10', food.id),
      e('2', '2026-05-20', transport.id),
    ]
    const { result, rerender } = renderHook(
      ({ filter }: { filter: string }) =>
        useVisibleExpenses({
          expenses,
          selectedMonth: '2026-05',
          categoryFilter: filter,
          categories: [food, transport],
        }),
      { initialProps: { filter: 'all' } },
    )
    const firstMonthly = result.current.monthlyExpenses
    const firstVisible = result.current.visibleExpenses

    // Switching only the category filter should not change monthlyExpenses
    // identity, but visibleExpenses must be a fresh array (different subset).
    rerender({ filter: food.id })
    expect(result.current.monthlyExpenses).toBe(firstMonthly)
    expect(result.current.visibleExpenses).not.toBe(firstVisible)
  })
})
