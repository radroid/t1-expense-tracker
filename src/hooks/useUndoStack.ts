import { useCallback, useRef, useState } from 'react'

// Single-step undo stack. A "stack" of size one by design — `push` REPLACES
// any pending action rather than growing a history. This matches the
// snackbar UX where only the most recent mutation has an Undo affordance,
// and stale "Undo" buttons would be confusing.
//
// The contract is intentionally narrow:
//   - push(action) → replace pending
//   - undo() → await inverse, clear pending (even on inverse failure)
//   - dismiss() → clear pending without invoking inverse
//
// Failure-handling: if the inverse rejects we log a console.warn and clear
// pending anyway. Surfacing a re-undo would risk an infinite loop and the
// user's intent ("undo this") was clear — better to fail closed than to
// strand a phantom Undo button on a failed reversal.

export interface UndoAction {
  label: string
  inverse: () => Promise<void>
}

export interface UseUndoStack {
  pending: UndoAction | null
  push: (action: UndoAction) => void
  undo: () => Promise<void>
  dismiss: () => void
}

export function useUndoStack(): UseUndoStack {
  const [pending, setPending] = useState<UndoAction | null>(null)
  // A ref mirrors the latest pending action so undo() can read the
  // CURRENT value without React having to flush a state read through a
  // setState updater. (The setState-updater snapshot approach
  // misbehaves when undo is called synchronously after push within the
  // same act() — the updater is queued, not invoked synchronously, so a
  // local variable assigned from it stays null.)
  const pendingRef = useRef<UndoAction | null>(null)

  const push = useCallback((action: UndoAction) => {
    pendingRef.current = action
    setPending(action)
  }, [])

  const dismiss = useCallback(() => {
    pendingRef.current = null
    setPending(null)
  }, [])

  const undo = useCallback(async () => {
    const current = pendingRef.current
    if (!current) return
    // Clear eagerly so a second call during the await is a no-op and the
    // toast can dismiss immediately rather than waiting on the inverse.
    pendingRef.current = null
    setPending(null)
    try {
      await current.inverse()
    } catch (err) {
      // Re-undo would loop; clear and warn.
      console.warn('Undo inverse failed:', err)
    }
  }, [])

  return { pending, push, undo, dismiss }
}
