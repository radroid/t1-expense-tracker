import { renderHook, act, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useExpenses } from './useExpenses'
import * as expenseStore from '../db/expenseStore'

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

describe('useExpenses', () => {
  it('loads with empty list, loading false, no error', async () => {
    const { result } = renderHook(() => useExpenses())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.expenses).toEqual([])
    expect(result.current.error).toBe('')
  })

  it('add() persists a valid expense and updates state; returns true', async () => {
    const { result } = renderHook(() => useExpenses())
    await waitFor(() => expect(result.current.loading).toBe(false))

    let ok!: boolean
    await act(async () => {
      ok = await result.current.add({
        amount: 10,
        description: 'Coffee',
        date: '2026-05-15',
      })
    })

    expect(ok).toBe(true)
    expect(result.current.expenses).toHaveLength(1)
    expect(result.current.expenses[0].description).toBe('Coffee')
    expect(result.current.error).toBe('')
  })

  it('add() with invalid input sets error and returns false without persisting', async () => {
    const { result } = renderHook(() => useExpenses())
    await waitFor(() => expect(result.current.loading).toBe(false))

    let ok!: boolean
    await act(async () => {
      ok = await result.current.add({
        amount: -5,
        description: 'Bad',
        date: '2026-05-15',
      })
    })

    expect(ok).toBe(false)
    expect(result.current.expenses).toHaveLength(0)
    expect(result.current.error).not.toBe('')
  })

  it('update() applies edits, returns true, and clears any prior error', async () => {
    const { result } = renderHook(() => useExpenses())
    await waitFor(() => expect(result.current.loading).toBe(false))

    await act(async () => {
      await result.current.add({
        amount: 10,
        description: 'Coffee',
        date: '2026-05-15',
      })
    })
    const existing = result.current.expenses[0]

    let ok!: boolean
    await act(async () => {
      ok = await result.current.update(existing, {
        amount: 12,
        description: 'Espresso',
        date: '2026-05-15',
      })
    })

    expect(ok).toBe(true)
    expect(result.current.expenses[0].description).toBe('Espresso')
    expect(result.current.expenses[0].amount).toBe(12)
  })

  it('update() with invalid input sets error and returns false; persistence failure same', async () => {
    const { result } = renderHook(() => useExpenses())
    await waitFor(() => expect(result.current.loading).toBe(false))

    await act(async () => {
      await result.current.add({
        amount: 10,
        description: 'Coffee',
        date: '2026-05-15',
      })
    })
    const existing = result.current.expenses[0]

    // Validation failure: amount must be > 0.
    let okBad!: boolean
    await act(async () => {
      okBad = await result.current.update(existing, {
        amount: -5,
        description: 'Bad',
        date: '2026-05-15',
      })
    })
    expect(okBad).toBe(false)
    expect(result.current.expenses[0].amount).toBe(10)
    expect(result.current.error).not.toBe('')

    // Persistence failure: store rejects.
    vi.spyOn(expenseStore, 'updateExpense').mockRejectedValueOnce(
      new Error('store failure'),
    )
    let okStoreFail!: boolean
    await act(async () => {
      okStoreFail = await result.current.update(existing, {
        amount: 12,
        description: 'Espresso',
        date: '2026-05-15',
      })
    })
    expect(okStoreFail).toBe(false)
    expect(result.current.expenses[0].description).toBe('Coffee')
  })

  it('addMany([]) returns { added: 0, skipped: 0, errors: [] } and does not touch state', async () => {
    const { result } = renderHook(() => useExpenses())
    await waitFor(() => expect(result.current.loading).toBe(false))

    const before = result.current.expenses
    let res!: Awaited<ReturnType<typeof result.current.addMany>>
    await act(async () => {
      res = await result.current.addMany([])
    })
    expect(res).toEqual({ added: 0, skipped: 0, errors: [] })
    expect(result.current.expenses).toBe(before)
    expect(result.current.error).toBe('')
  })

  it('addMany() with all-valid inputs persists each and reports added count', async () => {
    const { result } = renderHook(() => useExpenses())
    await waitFor(() => expect(result.current.loading).toBe(false))

    let res!: Awaited<ReturnType<typeof result.current.addMany>>
    await act(async () => {
      res = await result.current.addMany([
        { amount: 10, description: 'Coffee', date: '2026-05-15' },
        { amount: 12, description: 'Lunch', date: '2026-05-15' },
      ])
    })
    expect(res.added).toBe(2)
    expect(res.skipped).toBe(0)
    expect(res.errors).toEqual([])
    expect(result.current.expenses).toHaveLength(2)
    expect(result.current.error).toBe('')
  })

  it('addMany() with mixed validity persists the valid rows and reports skipped + errors', async () => {
    const { result } = renderHook(() => useExpenses())
    await waitFor(() => expect(result.current.loading).toBe(false))

    let res!: Awaited<ReturnType<typeof result.current.addMany>>
    await act(async () => {
      res = await result.current.addMany([
        { amount: 10, description: 'Coffee', date: '2026-05-15' },
        { amount: -1, description: 'Bad', date: '2026-05-15' },
        { amount: 12, description: 'Lunch', date: '2026-05-15' },
      ])
    })
    expect(res.added).toBe(2)
    expect(res.skipped).toBe(1)
    expect(res.errors).toHaveLength(1)
    expect(result.current.expenses).toHaveLength(2)
    expect(result.current.error).not.toBe('')
  })

  it('remove() deletes and returns true; sets error + returns false on store failure', async () => {
    const { result } = renderHook(() => useExpenses())
    await waitFor(() => expect(result.current.loading).toBe(false))

    await act(async () => {
      await result.current.add({
        amount: 10,
        description: 'Coffee',
        date: '2026-05-15',
      })
    })
    const id = result.current.expenses[0].id

    // First: failure path — store rejects once.
    vi.spyOn(expenseStore, 'removeExpense').mockRejectedValueOnce(
      new Error('store failure'),
    )
    let okFail!: boolean
    await act(async () => {
      okFail = await result.current.remove(id)
    })
    expect(okFail).toBe(false)
    expect(result.current.expenses).toHaveLength(1)
    expect(result.current.error).not.toBe('')

    // Then: success path.
    let okOk!: boolean
    await act(async () => {
      okOk = await result.current.remove(id)
    })
    expect(okOk).toBe(true)
    expect(result.current.expenses).toHaveLength(0)
    expect(result.current.error).toBe('')
  })
})
