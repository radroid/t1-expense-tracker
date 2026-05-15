import { renderHook, act, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useMonthlyBudgets } from './useMonthlyBudgets'
import * as budgetStore from '../db/budgetStore'

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

describe('useMonthlyBudgets', () => {
  it('loads with empty list, loading false, no error', async () => {
    const { result } = renderHook(() => useMonthlyBudgets())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.budgets).toEqual([])
    expect(result.current.error).toBe('')
  })

  it('set() persists a valid budget and returns true', async () => {
    const { result } = renderHook(() => useMonthlyBudgets())
    await waitFor(() => expect(result.current.loading).toBe(false))

    let ok!: boolean
    await act(async () => {
      ok = await result.current.set('2026-05', 500)
    })

    expect(ok).toBe(true)
    expect(result.current.budgets).toHaveLength(1)
    expect(result.current.budgets[0]).toEqual({ month: '2026-05', amount: 500 })
    expect(result.current.error).toBe('')
  })

  it('set() with invalid input sets error and returns false without persisting', async () => {
    const { result } = renderHook(() => useMonthlyBudgets())
    await waitFor(() => expect(result.current.loading).toBe(false))

    let ok!: boolean
    await act(async () => {
      ok = await result.current.set('2026-05', -5)
    })

    expect(ok).toBe(false)
    expect(result.current.budgets).toHaveLength(0)
    expect(result.current.error).not.toBe('')
  })

  it('set() with same month upserts (no duplicate row, amount updates)', async () => {
    const { result } = renderHook(() => useMonthlyBudgets())
    await waitFor(() => expect(result.current.loading).toBe(false))

    await act(async () => {
      await result.current.set('2026-05', 500)
    })
    await act(async () => {
      await result.current.set('2026-05', 750)
    })

    expect(result.current.budgets).toHaveLength(1)
    expect(result.current.budgets[0].amount).toBe(750)
  })

  it('remove() deletes and returns true', async () => {
    const { result } = renderHook(() => useMonthlyBudgets())
    await waitFor(() => expect(result.current.loading).toBe(false))

    await act(async () => {
      await result.current.set('2026-05', 500)
    })

    let ok!: boolean
    await act(async () => {
      ok = await result.current.remove('2026-05')
    })

    expect(ok).toBe(true)
    expect(result.current.budgets).toHaveLength(0)
    expect(result.current.error).toBe('')
  })

  it('remove() returns false and sets error on store failure', async () => {
    const { result } = renderHook(() => useMonthlyBudgets())
    await waitFor(() => expect(result.current.loading).toBe(false))

    await act(async () => {
      await result.current.set('2026-05', 500)
    })

    vi.spyOn(budgetStore, 'removeBudget').mockRejectedValueOnce(
      new Error('store failure'),
    )
    let ok!: boolean
    await act(async () => {
      ok = await result.current.remove('2026-05')
    })

    expect(ok).toBe(false)
    expect(result.current.budgets).toHaveLength(1)
    expect(result.current.error).not.toBe('')
  })

  it('getFor() returns the budget if present, undefined otherwise', async () => {
    const { result } = renderHook(() => useMonthlyBudgets())
    await waitFor(() => expect(result.current.loading).toBe(false))

    await act(async () => {
      await result.current.set('2026-05', 500)
    })

    expect(result.current.getFor('2026-05')).toEqual({
      month: '2026-05',
      amount: 500,
    })
    expect(result.current.getFor('2026-06')).toBeUndefined()
  })
})
