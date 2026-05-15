import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Spinner } from './Spinner'

describe('Spinner', () => {
  it('exposes role="status" with a default aria-label of "Loading…"', () => {
    render(<Spinner />)
    const node = screen.getByRole('status')
    expect(node).toBeInTheDocument()
    expect(node.getAttribute('aria-label')).toBe('Loading…')
  })

  it('honours a custom label on aria-label and on the visually hidden text', () => {
    render(<Spinner label="Fetching expenses" />)
    const node = screen.getByRole('status', { name: 'Fetching expenses' })
    expect(node).toBeInTheDocument()
    // Visually-hidden span carries the same text for screen readers.
    expect(screen.getByText('Fetching expenses')).toBeInTheDocument()
  })

  it('defaults to the medium size modifier and supports sm/lg', () => {
    const { rerender, container } = render(<Spinner />)
    expect(container.querySelector('.spinner--md')).not.toBeNull()
    rerender(<Spinner size="sm" />)
    expect(container.querySelector('.spinner--sm')).not.toBeNull()
    rerender(<Spinner size="lg" />)
    expect(container.querySelector('.spinner--lg')).not.toBeNull()
  })
})
