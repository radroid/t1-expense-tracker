import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { Expense } from '../lib/expense'
import { RunningTotal } from './RunningTotal'

function expense(amount: number, id: string): Expense {
  return { id, amount, description: 'test', date: '2026-01-01' }
}

describe('RunningTotal', () => {
  it('renders $0.00 for an empty array', () => {
    render(<RunningTotal expenses={[]} currency="USD" />)
    expect(screen.getByText('$0.00')).toBeInTheDocument()
  })

  it('renders the currency-formatted total for a given expenses array', () => {
    render(
      <RunningTotal
        expenses={[expense(1000, 'a'), expense(234.5, 'b')]}
        currency="USD"
      />,
    )
    expect(screen.getByText('$1,234.50')).toBeInTheDocument()
  })

  it('exposes the total with an accessible "Total" label', () => {
    render(<RunningTotal expenses={[expense(42, 'a')]} currency="USD" />)
    expect(screen.getByText('Total')).toBeInTheDocument()
    expect(screen.getByText('$42.00')).toBeInTheDocument()
  })

  it('renders the total in EUR when currency="EUR"', () => {
    render(<RunningTotal expenses={[expense(42, 'a')]} currency="EUR" />)
    expect(screen.getByText('€42.00')).toBeInTheDocument()
  })

  it('renders JPY with zero fraction digits', () => {
    render(
      <RunningTotal
        expenses={[expense(100, 'a'), expense(34.5, 'b')]}
        currency="JPY"
      />,
    )
    // 134.5 → ¥135 (halfExpand)
    expect(screen.getByText('¥135')).toBeInTheDocument()
  })
})
