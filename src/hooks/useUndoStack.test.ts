import { act, renderHook } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { useUndoStack } from './useUndoStack'

describe('useUndoStack', () => {
  it('starts with no pending action', () => {
    const { result } = renderHook(() => useUndoStack())
    expect(result.current.pending).toBeNull()
  })

  it('push() sets the current pending action', () => {
    const { result } = renderHook(() => useUndoStack())
    const inverse = vi.fn(async () => {})
    act(() => {
      result.current.push({ label: 'Deleted Coffee', inverse })
    })
    expect(result.current.pending?.label).toBe('Deleted Coffee')
  })

  it('push() REPLACES any pending action (single-step)', () => {
    const { result } = renderHook(() => useUndoStack())
    const inverseA = vi.fn(async () => {})
    const inverseB = vi.fn(async () => {})
    act(() => {
      result.current.push({ label: 'A', inverse: inverseA })
    })
    act(() => {
      result.current.push({ label: 'B', inverse: inverseB })
    })
    expect(result.current.pending?.label).toBe('B')
    // The replaced inverse should never be invoked by the hook.
    expect(inverseA).not.toHaveBeenCalled()
  })

  it('undo() invokes the inverse and clears pending', async () => {
    const { result } = renderHook(() => useUndoStack())
    const inverse = vi.fn(async () => {})
    act(() => {
      result.current.push({ label: 'Deleted', inverse })
    })
    await act(async () => {
      await result.current.undo()
    })
    expect(inverse).toHaveBeenCalledTimes(1)
    expect(result.current.pending).toBeNull()
  })

  it('dismiss() clears pending WITHOUT invoking the inverse', () => {
    const { result } = renderHook(() => useUndoStack())
    const inverse = vi.fn(async () => {})
    act(() => {
      result.current.push({ label: 'Deleted', inverse })
    })
    act(() => {
      result.current.dismiss()
    })
    expect(result.current.pending).toBeNull()
    expect(inverse).not.toHaveBeenCalled()
  })

  it('undo() is a no-op when there is no pending action', async () => {
    const { result } = renderHook(() => useUndoStack())
    await act(async () => {
      await result.current.undo()
    })
    expect(result.current.pending).toBeNull()
  })

  it('clears pending even if the inverse throws', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const { result } = renderHook(() => useUndoStack())
    const inverse = vi.fn(async () => {
      throw new Error('boom')
    })
    act(() => {
      result.current.push({ label: 'Deleted', inverse })
    })
    await act(async () => {
      await result.current.undo()
    })
    expect(result.current.pending).toBeNull()
    warn.mockRestore()
  })
})
