import { renderHook, act, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useRecurringTemplates } from './useRecurringTemplates'
import * as templateStore from '../db/recurringTemplateStore'

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

describe('useRecurringTemplates', () => {
  it('starts empty, loading=false, no error after mount', async () => {
    const { result } = renderHook(() => useRecurringTemplates())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.templates).toEqual([])
    expect(result.current.error).toBe('')
  })

  it('add() persists a valid template and returns true', async () => {
    const { result } = renderHook(() => useRecurringTemplates())
    await waitFor(() => expect(result.current.loading).toBe(false))

    let ok!: boolean
    await act(async () => {
      ok = await result.current.add({
        description: 'Rent',
        amount: 1500,
        frequency: 'monthly',
        dayOfMonth: 1,
      })
    })

    expect(ok).toBe(true)
    expect(result.current.templates).toHaveLength(1)
    expect(result.current.templates[0].description).toBe('Rent')
    expect(result.current.error).toBe('')
  })

  it('add() with invalid input surfaces validation error and returns false', async () => {
    const { result } = renderHook(() => useRecurringTemplates())
    await waitFor(() => expect(result.current.loading).toBe(false))

    let ok!: boolean
    await act(async () => {
      ok = await result.current.add({
        description: '',
        amount: 1500,
        frequency: 'monthly',
        dayOfMonth: 1,
      })
    })

    expect(ok).toBe(false)
    expect(result.current.templates).toHaveLength(0)
    expect(result.current.error).not.toBe('')
  })

  it('remove() deletes; returns false on store failure', async () => {
    const { result } = renderHook(() => useRecurringTemplates())
    await waitFor(() => expect(result.current.loading).toBe(false))

    await act(async () => {
      await result.current.add({
        description: 'Rent',
        amount: 1500,
        frequency: 'monthly',
        dayOfMonth: 1,
      })
    })
    const id = result.current.templates[0].id

    vi.spyOn(templateStore, 'removeRecurringTemplate').mockRejectedValueOnce(
      new Error('store failure'),
    )
    let okFail!: boolean
    await act(async () => {
      okFail = await result.current.remove(id)
    })
    expect(okFail).toBe(false)
    expect(result.current.error).not.toBe('')
    expect(result.current.templates).toHaveLength(1)

    let okOk!: boolean
    await act(async () => {
      okOk = await result.current.remove(id)
    })
    expect(okOk).toBe(true)
    expect(result.current.templates).toHaveLength(0)
    // Hook clears the error after a successful remove (matches the
    // contract on add()).
    expect(result.current.error).toBe('')
  })

  it('surfaces a load error if the initial fetch fails', async () => {
    vi.spyOn(templateStore, 'getAllRecurringTemplates').mockRejectedValueOnce(
      new Error('disk on fire'),
    )
    const { result } = renderHook(() => useRecurringTemplates())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.error).not.toBe('')
  })
})
