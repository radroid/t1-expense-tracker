import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { BudgetVsActual } from './BudgetVsActual'
import { computeBudgetStatus } from '../lib/budgetStatus'

describe('BudgetVsActual', () => {
  it('renders the empty-state message when there is no budget', () => {
    const status = computeBudgetStatus(undefined, 25)
    render(<BudgetVsActual status={status} currency="USD" />)
    expect(screen.getByText(/no budget set/i)).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('under-budget: progress bar width < 100%, no warning, "$X left" text', () => {
    const status = computeBudgetStatus(100, 40)
    const { container } = render(<BudgetVsActual status={status} currency="USD" />)
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
    const { container } = render(<BudgetVsActual status={status} currency="USD" />)
    const bar = container.querySelector(
      '.budget-vs-actual__bar',
    ) as HTMLElement
    expect(bar.style.width).toBe('100%')
    expect(bar.className).not.toContain('budget-vs-actual__bar--over')
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('over-budget: bar clamped to 100%, --over modifier present, warning rendered', () => {
    const status = computeBudgetStatus(100, 150)
    const { container } = render(<BudgetVsActual status={status} currency="USD" />)
    const bar = container.querySelector(
      '.budget-vs-actual__bar',
    ) as HTMLElement
    expect(bar.style.width).toBe('100%')
    expect(bar.className).toContain('budget-vs-actual__bar--over')

    const alert = screen.getByRole('alert')
    expect(alert).toHaveTextContent(/over budget by \$50\.00/i)
    expect(screen.getByText(/\$50\.00 over/)).toBeInTheDocument()
  })

  it('formats budget and actual via formatCurrency on the currency prop ($X.XX, not raw numbers)', () => {
    const status = computeBudgetStatus(50, 12.5)
    render(<BudgetVsActual status={status} currency="USD" />)
    expect(screen.getByText('$50.00')).toBeInTheDocument()
    expect(screen.getByText('$12.50')).toBeInTheDocument()
  })

  it('exposes the bar track as role="progressbar" with valuenow reflecting the spend ratio (P6.C a11y-005)', () => {
    // 50% used: $50 spent of $100. The role + aria-valuenow give SR users
    // the same progress information sighted users get from the bar width.
    const status = computeBudgetStatus(100, 50)
    render(<BudgetVsActual status={status} currency="USD" />)
    const bar = screen.getByRole('progressbar', { name: /budget used/i })
    expect(bar).toHaveAttribute('aria-valuenow', '50')
    expect(bar).toHaveAttribute('aria-valuemin', '0')
    expect(bar).toHaveAttribute('aria-valuemax', '100')
    expect(bar).toHaveAttribute('aria-valuetext', '$50.00 of $100.00')
  })

  it('re-renders without errors when props are unchanged', () => {
    const status = computeBudgetStatus(100, 40)
    const { rerender } = render(<BudgetVsActual status={status} currency="USD" />)
    expect(() =>
      rerender(<BudgetVsActual status={status} currency="USD" />),
    ).not.toThrow()
  })
})
