import { useEffect } from 'react'
import type { UndoAction } from '../hooks/useUndoStack'
import './UndoToast.css'

interface UndoToastProps {
  action: UndoAction | null
  onUndo: () => void
  onDismiss: () => void
  // Auto-dismiss delay. Default 6s — long enough to spot + click without
  // sticking around through a follow-up mutation.
  dismissMs?: number
}

// Bottom-of-screen snackbar that surfaces the most recent undoable mutation
// for a brief window. role="status" + aria-live="polite" because these are
// informational (vs. an interruptive "alert" — which would clobber the
// persistent app__error live region for a non-error event).
//
// Auto-dismiss is owned here rather than in the hook so the hook stays pure
// state. The effect re-runs when `action` changes (the toast remounts the
// timer for each new action) and is cleaned up on unmount / new action.
export function UndoToast({
  action,
  onUndo,
  onDismiss,
  dismissMs = 6000,
}: UndoToastProps) {
  useEffect(() => {
    if (!action) return
    const t = setTimeout(() => {
      onDismiss()
    }, dismissMs)
    return () => clearTimeout(t)
  }, [action, dismissMs, onDismiss])

  if (!action) return null

  return (
    <div className="undo-toast" role="status" aria-live="polite">
      <span className="undo-toast__label">{action.label}</span>
      <button
        type="button"
        className="undo-toast__button"
        onClick={onUndo}
      >
        Undo
      </button>
      <button
        type="button"
        className="undo-toast__close"
        aria-label="Dismiss undo"
        onClick={onDismiss}
      >
        ×
      </button>
    </div>
  )
}
