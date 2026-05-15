import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { Expense } from '../lib/expense'
import type { Category } from '../lib/category'
import { SpendingChart } from './SpendingChart'

function expense(
  amount: number,
  id: string,
  categoryId?: string,
): Expense {
  const e: Expense = { id, amount, description: 'test', date: '2026-01-01' }
  if (categoryId !== undefined) e.categoryId = categoryId
  return e
}

function category(id: string, name: string, color = '#000000'): Category {
  return { id, name, color }
}

describe('SpendingChart', () => {
  it('renders an empty-state message when there are no expenses', () => {
    render(<SpendingChart expenses={[]} categories={[]} currency="USD" />)
    expect(screen.getByText('No data to chart')).toBeInTheDocument()
  })

  it('renders a single bar with category color, name, and formatted value', () => {
    const food = category('c1', 'Food', '#ef4444')
    const { container } = render(
      <SpendingChart
        expenses={[expense(25, 'e1', 'c1')]}
        categories={[food]}
        currency="USD"
      />,
    )
    expect(screen.getByText('Food')).toBeInTheDocument()
    expect(screen.getByText('$25.00')).toBeInTheDocument()
    const bar = container.querySelector('.spending-chart__bar')
    expect(bar).not.toBeNull()
    expect(bar!.getAttribute('fill')).toBe('#ef4444')
    expect(bar!.getAttribute('aria-label')).toBe('Food: $25.00')
  })

  it('renders all bars sorted by total descending', () => {
    const food = category('c1', 'Food')
    const transport = category('c2', 'Transport')
    const housing = category('c3', 'Housing')
    const { container } = render(
      <SpendingChart
        expenses={[
          expense(10, 'e1', 'c1'),
          expense(100, 'e2', 'c3'),
          expense(50, 'e3', 'c2'),
        ]}
        categories={[food, transport, housing]}
        currency="USD"
      />,
    )
    const bars = container.querySelectorAll('.spending-chart__bar')
    expect(bars).toHaveLength(3)
    expect(bars[0].getAttribute('aria-label')).toBe('Housing: $100.00')
    expect(bars[1].getAttribute('aria-label')).toBe('Transport: $50.00')
    expect(bars[2].getAttribute('aria-label')).toBe('Food: $10.00')
  })

  it('buckets orphaned expenses under "Uncategorized" with the #9ca3af swatch', () => {
    const food = category('c1', 'Food', '#ef4444')
    const { container } = render(
      <SpendingChart
        expenses={[
          expense(10, 'e1', 'c1'),
          expense(3, 'e2'),
          expense(2, 'e3', 'missing-cat'),
        ]}
        categories={[food]}
        currency="USD"
      />,
    )
    expect(screen.getByText('Uncategorized')).toBeInTheDocument()
    const bars = container.querySelectorAll('.spending-chart__bar')
    const uncategorizedBar = Array.from(bars).find(
      (b) => b.getAttribute('aria-label') === 'Uncategorized: $5.00',
    )
    expect(uncategorizedBar).toBeDefined()
    expect(uncategorizedBar!.getAttribute('fill')).toBe('#9ca3af')
  })

  it('formats values via formatCurrency (e.g. $25.00, not 25)', () => {
    const food = category('c1', 'Food')
    render(
      <SpendingChart
        expenses={[expense(25, 'e1', 'c1')]}
        categories={[food]}
        currency="USD"
      />,
    )
    expect(screen.getByText('$25.00')).toBeInTheDocument()
    expect(screen.queryByText('25')).not.toBeInTheDocument()
  })

  it('marks the svg with role="img" and an accessible label', () => {
    const food = category('c1', 'Food')
    render(
      <SpendingChart
        expenses={[expense(25, 'e1', 'c1')]}
        categories={[food]}
        currency="USD"
      />,
    )
    const svg = screen.getByRole('img', { name: 'Spending by category' })
    expect(svg).toBeInTheDocument()
  })
})
