import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { Expense } from '../lib/expense'
import { RunningTotal } from './RunningTotal'

function expense(amount: number, id: string): Expense {
  return { id, amount, description: 'test', date: '2026-01-01' }
}

describe('RunningTotal', () => {
  it('renders $0.00 for an empty array', () => {
    render(<RunningTotal expenses={[]} />)
    expect(screen.getByText('$0.00')).toBeInTheDocument()
  })

  it('renders the currency-formatted total for a given expenses array', () => {
    render(
      <RunningTotal expenses={[expense(1000, 'a'), expense(234.5, 'b')]} />,
    )
    expect(screen.getByText('$1,234.50')).toBeInTheDocument()
  })

  it('exposes the total with an accessible "Total" label', () => {
    render(<RunningTotal expenses={[expense(42, 'a')]} />)
    expect(screen.getByText('Total')).toBeInTheDocument()
    expect(screen.getByText('$42.00')).toBeInTheDocument()
  })
})
