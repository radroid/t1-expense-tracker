import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, it, expect, vi } from 'vitest'
import { UndoToast } from './UndoToast'
import type { UndoAction } from '../hooks/useUndoStack'

const noopInverse = async () => {}

const sampleAction = (label = 'Deleted Coffee'): UndoAction => ({
  label,
  inverse: noopInverse,
})

describe('UndoToast', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders nothing when action is null', () => {
    const { container } = render(
      <UndoToast action={null} onUndo={() => {}} onDismiss={() => {}} />,
    )
    expect(container.firstChild).toBeNull()
  })

  it('renders the label and Undo + dismiss buttons when an action is set', () => {
    render(
      <UndoToast
        action={sampleAction('Deleted Coffee')}
        onUndo={() => {}}
        onDismiss={() => {}}
      />,
    )
    expect(screen.getByText(/Deleted Coffee/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^undo$/i })).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /dismiss undo/i }),
    ).toBeInTheDocument()
  })

  it('uses role="status" with aria-live="polite"', () => {
    render(
      <UndoToast
        action={sampleAction()}
        onUndo={() => {}}
        onDismiss={() => {}}
      />,
    )
    const node = screen.getByRole('status')
    expect(node.getAttribute('aria-live')).toBe('polite')
  })

  it('clicking Undo invokes onUndo', () => {
    const onUndo = vi.fn()
    render(
      <UndoToast
        action={sampleAction()}
        onUndo={onUndo}
        onDismiss={() => {}}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: /^undo$/i }))
    expect(onUndo).toHaveBeenCalledTimes(1)
  })

  it('clicking dismiss invokes onDismiss', () => {
    const onDismiss = vi.fn()
    render(
      <UndoToast
        action={sampleAction()}
        onUndo={() => {}}
        onDismiss={onDismiss}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: /dismiss undo/i }))
    expect(onDismiss).toHaveBeenCalledTimes(1)
  })

  it('auto-dismisses after the default timeout', () => {
    vi.useFakeTimers()
    const onDismiss = vi.fn()
    render(
      <UndoToast
        action={sampleAction()}
        onUndo={() => {}}
        onDismiss={onDismiss}
        dismissMs={3000}
      />,
    )
    expect(onDismiss).not.toHaveBeenCalled()
    act(() => {
      vi.advanceTimersByTime(3000)
    })
    expect(onDismiss).toHaveBeenCalledTimes(1)
  })

  it('resets the auto-dismiss timer when a new action arrives', () => {
    vi.useFakeTimers()
    const onDismiss = vi.fn()
    const first = sampleAction('First')
    const second = sampleAction('Second')
    const { rerender } = render(
      <UndoToast
        action={first}
        onUndo={() => {}}
        onDismiss={onDismiss}
        dismissMs={1000}
      />,
    )
    // Halfway through the first timer.
    act(() => {
      vi.advanceTimersByTime(600)
    })
    // New action replaces — timer should restart.
    rerender(
      <UndoToast
        action={second}
        onUndo={() => {}}
        onDismiss={onDismiss}
        dismissMs={1000}
      />,
    )
    // After another 600ms (1200ms total) the FIRST timer would have fired
    // — but the new action reset it, so no dismiss yet.
    act(() => {
      vi.advanceTimersByTime(600)
    })
    expect(onDismiss).not.toHaveBeenCalled()
    // Push to 1000ms post-second-action and now it fires.
    act(() => {
      vi.advanceTimersByTime(400)
    })
    expect(onDismiss).toHaveBeenCalledTimes(1)
  })
})
