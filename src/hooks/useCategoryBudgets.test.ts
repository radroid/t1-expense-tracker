import { renderHook, act, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useCategoryBudgets } from './useCategoryBudgets'
import * as categoryBudgetStore from '../db/categoryBudgetStore'
import { categoryBudgetId } from '../lib/categoryBudget'

beforeEach(async () => {
  await new Promise<void>((resolve, reject) => {
    const req = indexedDB.deleteDatabase('expense-tracker')
    req.onsuccess = () => resolve()
    req.onerror = () => reject(req.error)
    req.onblocked = () =>
      reject(new Error('deleteDatabase blocked — a connection was left open'))
  })
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('useCategoryBudgets', () => {
  it('loads with empty list, loading false, no error', async () => {
    const { result } = renderHook(() => useCategoryBudgets())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.categoryBudgets).toEqual([])
    expect(result.current.error).toBe('')
  })

  it('set() persists a valid budget and returns true', async () => {
    const { result } = renderHook(() => useCategoryBudgets())
    await waitFor(() => expect(result.current.loading).toBe(false))

    let ok!: boolean
    await act(async () => {
      ok = await result.current.set('2026-05', 'cat-food', 200)
    })

    expect(ok).toBe(true)
    expect(result.current.categoryBudgets).toHaveLength(1)
    expect(result.current.categoryBudgets[0]).toEqual({
      id: categoryBudgetId('2026-05', 'cat-food'),
      month: '2026-05',
      categoryId: 'cat-food',
      amount: 200,
    })
    expect(result.current.error).toBe('')
  })

  it('set() with invalid amount sets error and returns false without persisting', async () => {
    const { result } = renderHook(() => useCategoryBudgets())
    await waitFor(() => expect(result.current.loading).toBe(false))

    let ok!: boolean
    await act(async () => {
      ok = await result.current.set('2026-05', 'cat-food', -5)
    })

    expect(ok).toBe(false)
    expect(result.current.categoryBudgets).toHaveLength(0)
    expect(result.current.error).not.toBe('')
  })

  it('set() upserts on the same (month, categoryId) — no duplicate row', async () => {
    const { result } = renderHook(() => useCategoryBudgets())
    await waitFor(() => expect(result.current.loading).toBe(false))

    await act(async () => {
      await result.current.set('2026-05', 'cat-food', 200)
    })
    await act(async () => {
      await result.current.set('2026-05', 'cat-food', 500)
    })

    expect(result.current.categoryBudgets).toHaveLength(1)
    expect(result.current.categoryBudgets[0].amount).toBe(500)
  })

  it('set() clears a previous validation error on success', async () => {
    const { result } = renderHook(() => useCategoryBudgets())
    await waitFor(() => expect(result.current.loading).toBe(false))

    await act(async () => {
      await result.current.set('2026-05', 'cat-food', -1)
    })
    expect(result.current.error).not.toBe('')

    await act(async () => {
      await result.current.set('2026-05', 'cat-food', 100)
    })
    expect(result.current.error).toBe('')
  })

  it('getFor() returns the row when present, undefined otherwise', async () => {
    const { result } = renderHook(() => useCategoryBudgets())
    await waitFor(() => expect(result.current.loading).toBe(false))

    await act(async () => {
      await result.current.set('2026-05', 'cat-food', 200)
    })

    expect(result.current.getFor('2026-05', 'cat-food')).toMatchObject({
      month: '2026-05',
      categoryId: 'cat-food',
      amount: 200,
    })
    expect(result.current.getFor('2026-05', 'cat-rent')).toBeUndefined()
    expect(result.current.getFor('2026-06', 'cat-food')).toBeUndefined()
  })

  it('remove() deletes and returns true', async () => {
    const { result } = renderHook(() => useCategoryBudgets())
    await waitFor(() => expect(result.current.loading).toBe(false))

    await act(async () => {
      await result.current.set('2026-05', 'cat-food', 200)
    })

    let ok!: boolean
    await act(async () => {
      ok = await result.current.remove(categoryBudgetId('2026-05', 'cat-food'))
    })

    expect(ok).toBe(true)
    expect(result.current.categoryBudgets).toHaveLength(0)
    expect(result.current.error).toBe('')
  })

  it('remove() returns false and sets error on store failure', async () => {
    const { result } = renderHook(() => useCategoryBudgets())
    await waitFor(() => expect(result.current.loading).toBe(false))

    await act(async () => {
      await result.current.set('2026-05', 'cat-food', 200)
    })

    vi.spyOn(categoryBudgetStore, 'removeCategoryBudget').mockRejectedValueOnce(
      new Error('store failure'),
    )
    let ok!: boolean
    await act(async () => {
      ok = await result.current.remove(categoryBudgetId('2026-05', 'cat-food'))
    })

    expect(ok).toBe(false)
    expect(result.current.categoryBudgets).toHaveLength(1)
    expect(result.current.error).not.toBe('')
  })

  it('surfaces a load error when the store fails to read', async () => {
    vi.spyOn(categoryBudgetStore, 'getAllCategoryBudgets').mockRejectedValueOnce(
      new Error('store failure'),
    )
    const { result } = renderHook(() => useCategoryBudgets())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.error).toBe('Failed to load category budgets.')
  })
})
