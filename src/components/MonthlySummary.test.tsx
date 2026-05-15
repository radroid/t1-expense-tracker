import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { Expense } from '../lib/expense'
import { MonthlySummary } from './MonthlySummary'

function expense(amount: number, id: string): Expense {
  return { id, amount, description: 'test', date: '2026-01-01' }
}

describe('MonthlySummary', () => {
  it('renders Total, Average, and Count rows for a non-empty list', () => {
    render(
      <MonthlySummary
        expenses={[expense(10, 'a'), expense(20, 'b'), expense(30, 'c')]}
        currency="USD"
      />,
    )
    expect(screen.getByText('Total')).toBeInTheDocument()
    expect(screen.getByText('Average')).toBeInTheDocument()
    expect(screen.getByText('Count')).toBeInTheDocument()
  })

  it('renders the empty state when expenses is []', () => {
    render(<MonthlySummary expenses={[]} currency="USD" />)
    expect(screen.getByText('No expenses this period')).toBeInTheDocument()
    expect(screen.queryByText('Total')).not.toBeInTheDocument()
    expect(screen.queryByText('Average')).not.toBeInTheDocument()
    expect(screen.queryByText('Count')).not.toBeInTheDocument()
  })

  it('formats total and average with formatCurrency', () => {
    render(
      <MonthlySummary
        expenses={[expense(20, 'a'), expense(30, 'b')]}
        currency="USD"
      />,
    )
    expect(screen.getByText('$50.00')).toBeInTheDocument()
    expect(screen.getByText('$25.00')).toBeInTheDocument()
  })

  it('renders count as a raw integer (no currency formatting)', () => {
    render(
      <MonthlySummary
        expenses={[expense(20, 'a'), expense(30, 'b')]}
        currency="USD"
      />,
    )
    expect(screen.getByText('2')).toBeInTheDocument()
    expect(screen.queryByText('$2.00')).not.toBeInTheDocument()
  })
})
