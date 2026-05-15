import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { BudgetVsActual } from './BudgetVsActual'
import { computeBudgetStatus } from '../lib/budgetStatus'

describe('BudgetVsActual', () => {
  it('renders the empty-state message when there is no budget', () => {
    const status = computeBudgetStatus(undefined, 25)
    render(<BudgetVsActual status={status} />)
    expect(screen.getByText(/no budget set/i)).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('under-budget: progress bar width < 100%, no warning, "$X left" text', () => {
    const status = computeBudgetStatus(100, 40)
    const { container } = render(<BudgetVsActual status={status} />)
    const bar = container.querySelector(
      '.budget-vs-actual__bar',
    ) as HTMLElement
    expect(bar).not.toBeNull()
    expect(bar.style.width).toBe('40%')
    expect(bar.className).not.toContain('budget-vs-actual__bar--over')
    expect(screen.getByText(/\$60\.00 left/)).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('exact-budget: progress bar width 100%, no warning', () => {
    const status = computeBudgetStatus(100, 100)
    const { container } = render(<BudgetVsActual status={status} />)
    const bar = container.querySelector(
      '.budget-vs-actual__bar',
    ) as HTMLElement
    expect(bar.style.width).toBe('100%')
    expect(bar.className).not.toContain('budget-vs-actual__bar--over')
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('over-budget: bar clamped to 100%, --over modifier present, warning rendered', () => {
    const status = computeBudgetStatus(100, 150)
    const { container } = render(<BudgetVsActual status={status} />)
    const bar = container.querySelector(
      '.budget-vs-actual__bar',
    ) as HTMLElement
    expect(bar.style.width).toBe('100%')
    expect(bar.className).toContain('budget-vs-actual__bar--over')

    const alert = screen.getByRole('alert')
    expect(alert).toHaveTextContent(/over budget by \$50\.00/i)
    expect(screen.getByText(/\$50\.00 over/)).toBeInTheDocument()
  })

  it('formats budget and actual via formatUSD ($X.XX, not raw numbers)', () => {
    const status = computeBudgetStatus(50, 12.5)
    render(<BudgetVsActual status={status} />)
    expect(screen.getByText('$50.00')).toBeInTheDocument()
    expect(screen.getByText('$12.50')).toBeInTheDocument()
  })

  it('is a pure renderer: re-rendering with same props yields the same output', () => {
    const status = computeBudgetStatus(100, 40)
    const { container, rerender } = render(<BudgetVsActual status={status} />)
    const first = container.innerHTML
    rerender(<BudgetVsActual status={status} />)
    expect(container.innerHTML).toBe(first)
  })
})
