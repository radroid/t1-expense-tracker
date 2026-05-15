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

const e = (
  id: string,
  date: string,
  categoryId?: string,
  description?: string,
): Expense => ({
  id,
  amount: 10,
  description: description ?? `expense ${id}`,
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

  it('narrows visibleExpenses by searchTerm (case-insensitive substring)', () => {
    const expenses = [
      e('1', '2026-05-10', food.id, 'Morning Coffee'),
      e('2', '2026-05-15', food.id, 'Lunch'),
      e('3', '2026-05-20', transport.id, 'Iced COFFEE'),
    ]
    const { result } = renderHook(() =>
      useVisibleExpenses({
        expenses,
        selectedMonth: '2026-05',
        categoryFilter: 'all',
        categories: [food, transport],
        searchTerm: 'coffee',
        dateRange: null,
      }),
    )

    expect(result.current.monthlyExpenses).toEqual([
      expenses[0],
      expenses[1],
      expenses[2],
    ])
    expect(result.current.visibleExpenses).toEqual([expenses[0], expenses[2]])
  })

  it('passes through unchanged when searchTerm is empty and dateRange is null', () => {
    const expenses = [
      e('1', '2026-05-10', food.id),
      e('2', '2026-05-20', transport.id),
    ]
    const { result } = renderHook(() =>
      useVisibleExpenses({
        expenses,
        selectedMonth: '2026-05',
        categoryFilter: 'all',
        categories: [food, transport],
        searchTerm: '',
        dateRange: null,
      }),
    )
    expect(result.current.visibleExpenses).toEqual([expenses[0], expenses[1]])
  })

  it('narrows visibleExpenses by dateRange but does NOT narrow monthlyExpenses (budget-coherence)', () => {
    const expenses = [
      e('1', '2026-05-05', food.id),
      e('2', '2026-05-10', food.id),
      e('3', '2026-05-20', transport.id),
      e('4', '2026-05-25', transport.id),
    ]
    const { result } = renderHook(() =>
      useVisibleExpenses({
        expenses,
        selectedMonth: '2026-05',
        categoryFilter: 'all',
        categories: [food, transport],
        searchTerm: '',
        dateRange: { from: '2026-05-10', to: '2026-05-20' },
      }),
    )

    // monthlyExpenses MUST stay month-scoped (drives budget actual).
    expect(result.current.monthlyExpenses).toEqual([
      expenses[0],
      expenses[1],
      expenses[2],
      expenses[3],
    ])
    // visibleExpenses is range-narrowed.
    expect(result.current.visibleExpenses).toEqual([expenses[1], expenses[2]])
  })

  it('does not recompute monthlyExpenses when only searchTerm changes', () => {
    const expenses = [
      e('1', '2026-05-10', food.id, 'Coffee'),
      e('2', '2026-05-20', transport.id, 'Bus'),
    ]
    const { result, rerender } = renderHook(
      ({ searchTerm }: { searchTerm: string }) =>
        useVisibleExpenses({
          expenses,
          selectedMonth: '2026-05',
          categoryFilter: 'all',
          categories: [food, transport],
          searchTerm,
          dateRange: null,
        }),
      { initialProps: { searchTerm: '' } },
    )
    const firstMonthly = result.current.monthlyExpenses

    rerender({ searchTerm: 'coffee' })
    expect(result.current.monthlyExpenses).toBe(firstMonthly)
    expect(result.current.visibleExpenses).toEqual([expenses[0]])
  })

  it('does not recompute monthlyExpenses when only dateRange changes', () => {
    const expenses = [
      e('1', '2026-05-10', food.id),
      e('2', '2026-05-20', transport.id),
    ]
    const { result, rerender } = renderHook(
      ({ dateRange }: { dateRange: { from: string; to: string } | null }) =>
        useVisibleExpenses({
          expenses,
          selectedMonth: '2026-05',
          categoryFilter: 'all',
          categories: [food, transport],
          searchTerm: '',
          dateRange,
        }),
      { initialProps: { dateRange: null as { from: string; to: string } | null } },
    )
    const firstMonthly = result.current.monthlyExpenses

    rerender({ dateRange: { from: '2026-05-15', to: '2026-05-25' } })
    expect(result.current.monthlyExpenses).toBe(firstMonthly)
    expect(result.current.visibleExpenses).toEqual([expenses[1]])
  })

  it('omitting searchTerm and dateRange defaults to no-op filters', () => {
    const expenses = [
      e('1', '2026-05-10', food.id),
      e('2', '2026-05-20', transport.id),
    ]
    const { result } = renderHook(() =>
      useVisibleExpenses({
        expenses,
        selectedMonth: '2026-05',
        categoryFilter: 'all',
        categories: [food, transport],
      }),
    )
    expect(result.current.visibleExpenses).toEqual([expenses[0], expenses[1]])
  })
})
