import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { EmptyState } from './EmptyState'

describe('EmptyState', () => {
  it('renders the title as visible text', () => {
    render(<EmptyState title="No expenses yet" />)
    expect(screen.getByText('No expenses yet')).toBeInTheDocument()
  })

  it('exposes role="status" so assistive tech treats it as a live region', () => {
    render(<EmptyState title="No expenses yet" />)
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('renders the optional hint when provided', () => {
    render(
      <EmptyState
        title="No expenses yet"
        hint="Add one with the form above"
      />,
    )
    expect(screen.getByText('Add one with the form above')).toBeInTheDocument()
  })

  it('omits the hint element entirely when not provided', () => {
    const { container } = render(<EmptyState title="No data" />)
    expect(
      container.querySelector('.empty-state__hint'),
    ).not.toBeInTheDocument()
  })

  it('renders the optional icon and marks it aria-hidden so screen readers skip it', () => {
    const { container } = render(
      <EmptyState
        title="Nothing"
        icon={<svg data-testid="i" />}
      />,
    )
    const iconWrapper = container.querySelector('.empty-state__icon')
    expect(iconWrapper).not.toBeNull()
    expect(iconWrapper!.getAttribute('aria-hidden')).toBe('true')
  })
})
