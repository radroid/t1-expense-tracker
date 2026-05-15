import { renderHook, act, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useCategories } from './useCategories'
import * as categoryStore from '../db/categoryStore'
import { categoryMessages } from '../lib/errorMessages'

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

describe('useCategories', () => {
  it('loads seeded defaults on first run, loading false, no error', async () => {
    const { result } = renderHook(() => useCategories())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.categories.length).toBeGreaterThan(0)
    expect(
      result.current.categories.map((c) => c.name),
    ).toContain('Food')
    expect(result.current.error).toBe('')
  })

  it('add() persists a valid category and returns true', async () => {
    const { result } = renderHook(() => useCategories())
    await waitFor(() => expect(result.current.loading).toBe(false))
    const before = result.current.categories.length

    let ok!: boolean
    await act(async () => {
      ok = await result.current.add({ name: 'Travel', color: '#123456' })
    })

    expect(ok).toBe(true)
    expect(result.current.categories).toHaveLength(before + 1)
    expect(result.current.categories.map((c) => c.name)).toContain('Travel')
  })

  it('add() with invalid input sets error and returns false', async () => {
    const { result } = renderHook(() => useCategories())
    await waitFor(() => expect(result.current.loading).toBe(false))
    const before = result.current.categories.length

    let ok!: boolean
    await act(async () => {
      ok = await result.current.add({ name: '', color: '#123456' })
    })

    expect(ok).toBe(false)
    expect(result.current.categories).toHaveLength(before)
    expect(result.current.error).not.toBe('')
  })

  it('rename() updates the category name; returns false if id unknown', async () => {
    const { result } = renderHook(() => useCategories())
    await waitFor(() => expect(result.current.loading).toBe(false))
    const food = result.current.categories.find((c) => c.name === 'Food')!

    let ok!: boolean
    await act(async () => {
      ok = await result.current.rename(food.id, 'Groceries')
    })
    expect(ok).toBe(true)
    expect(
      result.current.categories.find((c) => c.id === food.id)?.name,
    ).toBe('Groceries')

    let okBad!: boolean
    await act(async () => {
      okBad = await result.current.rename('nope-id', 'Whatever')
    })
    expect(okBad).toBe(false)
    expect(result.current.error).not.toBe('')
  })

  // P6.E — `setError` is exposed so the App.tsx orchestration layer can
  // surface the "category is in use" message without having to add a
  // cross-domain check inside the hook itself. The hook stays a thin CRUD
  // wrapper; the in-use guard lives in App.tsx.
  it('exposes setError so the App-layer can surface cross-domain errors', async () => {
    const { result } = renderHook(() => useCategories())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.error).toBe('')

    act(() => {
      result.current.setError('Custom message from orchestration layer')
    })

    expect(result.current.error).toBe('Custom message from orchestration layer')
  })

  // P6.E — `categoryMessages.inUse` is a factory because the count varies
  // per call. Pluralization matters: "1 expense" vs "N expenses".
  it('categoryMessages.inUse pluralizes 1 vs N correctly', () => {
    expect(categoryMessages.inUse(1)).toBe(
      'Category is used by 1 expense. Remove or recategorize it first.',
    )
    expect(categoryMessages.inUse(2)).toBe(
      'Category is used by 2 expenses. Remove or recategorize them first.',
    )
    expect(categoryMessages.inUse(7)).toBe(
      'Category is used by 7 expenses. Remove or recategorize them first.',
    )
  })

  it('remove() deletes; returns false on store failure', async () => {
    const { result } = renderHook(() => useCategories())
    await waitFor(() => expect(result.current.loading).toBe(false))
    const food = result.current.categories.find((c) => c.name === 'Food')!

    vi.spyOn(categoryStore, 'removeCategory').mockRejectedValueOnce(
      new Error('store failure'),
    )
    let okFail!: boolean
    await act(async () => {
      okFail = await result.current.remove(food.id)
    })
    expect(okFail).toBe(false)
    expect(result.current.error).not.toBe('')

    let okOk!: boolean
    await act(async () => {
      okOk = await result.current.remove(food.id)
    })
    expect(okOk).toBe(true)
    expect(result.current.categories.find((c) => c.id === food.id)).toBeUndefined()
  })
})
