import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { FieldError } from './FieldError'

describe('FieldError', () => {
  it('renders a stable slot (no role=alert) when message is null', () => {
    render(<FieldError id="x-err" message={null} />)
    const node = document.getElementById('x-err')
    expect(node).not.toBeNull()
    expect(node!.getAttribute('role')).toBeNull()
    expect(node!.getAttribute('aria-live')).toBe('polite')
    // No text content yet — but the element is present so the layout has
    // already reserved space and the live region is ready to announce.
    expect(node!.textContent ?? '').toBe('')
  })

  it('renders a stable slot (no role=alert) when message is empty string', () => {
    render(<FieldError id="x-err" message="" />)
    const node = document.getElementById('x-err')
    expect(node).not.toBeNull()
    expect(node!.getAttribute('role')).toBeNull()
  })

  it('renders with role=alert and the text when message is non-empty', () => {
    render(<FieldError id="x-err" message="Please enter an amount." />)
    const alert = screen.getByRole('alert')
    expect(alert).toBeInTheDocument()
    expect(alert.id).toBe('x-err')
    expect(alert.textContent).toBe('Please enter an amount.')
  })

  it('places the id on the rendered element so aria-describedby can target it', () => {
    render(<FieldError id="budget-form-error" message="Bad amount" />)
    const node = document.getElementById('budget-form-error')
    expect(node).not.toBeNull()
    expect(node!.tagName.toLowerCase()).toBe('p')
  })

  it('toggles the role=alert attribute as the message goes empty → text → empty', () => {
    const { rerender } = render(<FieldError id="x-err" message={null} />)
    expect(document.getElementById('x-err')?.getAttribute('role')).toBeNull()

    rerender(<FieldError id="x-err" message="Whoops" />)
    expect(document.getElementById('x-err')?.getAttribute('role')).toBe('alert')
    expect(screen.getByRole('alert').textContent).toBe('Whoops')

    rerender(<FieldError id="x-err" message="" />)
    expect(document.getElementById('x-err')?.getAttribute('role')).toBeNull()
    expect(document.getElementById('x-err')?.textContent ?? '').toBe('')
  })
})
