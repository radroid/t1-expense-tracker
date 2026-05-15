import { describe, it, expect } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import type { Expense } from '../lib/expense'
import type { Category } from '../lib/category'
import { SpendingByCategory } from './SpendingByCategory'

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

describe('SpendingByCategory', () => {
  it('renders an empty-state message when there are no expenses', () => {
    render(<SpendingByCategory expenses={[]} categories={[]} currency="USD" />)
    expect(screen.getByText('No spending yet.')).toBeInTheDocument()
  })

  it('renders one row per non-zero group with name + currency total', () => {
    const food = category('c1', 'Food', '#ef4444')
    const transport = category('c2', 'Transport', '#3b82f6')
    render(
      <SpendingByCategory
        expenses={[
          expense(10, 'e1', 'c1'),
          expense(20, 'e2', 'c1'),
          expense(5, 'e3', 'c2'),
        ]}
        categories={[food, transport]}
        currency="USD"
      />,
    )
    expect(screen.getByText('Food')).toBeInTheDocument()
    expect(screen.getByText('Transport')).toBeInTheDocument()
    expect(screen.getByText('$30.00')).toBeInTheDocument()
    expect(screen.getByText('$5.00')).toBeInTheDocument()
  })

  it('omits zero-total categories (no row for category with no expenses)', () => {
    const food = category('c1', 'Food')
    const transport = category('c2', 'Transport')
    render(
      <SpendingByCategory
        expenses={[expense(10, 'e1', 'c1')]}
        categories={[food, transport]}
        currency="USD"
      />,
    )
    expect(screen.getByText('Food')).toBeInTheDocument()
    expect(screen.queryByText('Transport')).not.toBeInTheDocument()
  })

  it('sorts rows by total descending (biggest spend first)', () => {
    const food = category('c1', 'Food')
    const transport = category('c2', 'Transport')
    const housing = category('c3', 'Housing')
    render(
      <SpendingByCategory
        expenses={[
          expense(10, 'e1', 'c1'),
          expense(100, 'e2', 'c3'),
          expense(50, 'e3', 'c2'),
        ]}
        categories={[food, transport, housing]}
        currency="USD"
      />,
    )
    const rows = screen.getAllByRole('listitem')
    expect(rows).toHaveLength(3)
    expect(within(rows[0]).getByText('Housing')).toBeInTheDocument()
    expect(within(rows[0]).getByText('$100.00')).toBeInTheDocument()
    expect(within(rows[1]).getByText('Transport')).toBeInTheDocument()
    expect(within(rows[1]).getByText('$50.00')).toBeInTheDocument()
    expect(within(rows[2]).getByText('Food')).toBeInTheDocument()
    expect(within(rows[2]).getByText('$10.00')).toBeInTheDocument()
  })

  it('renders the null bucket as "Uncategorized" with a swatch', () => {
    const food = category('c1', 'Food')
    render(
      <SpendingByCategory
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
    expect(screen.getByText('$5.00')).toBeInTheDocument()
    const uncategorizedRow = screen.getByText('Uncategorized').closest('li')
    expect(uncategorizedRow).not.toBeNull()
    const swatch = uncategorizedRow!.querySelector('.spending-by-category__swatch')
    expect(swatch).not.toBeNull()
  })

  it('renders only the null bucket when all expenses are uncategorized', () => {
    render(
      <SpendingByCategory
        expenses={[expense(4, 'e1'), expense(6, 'e2')]}
        categories={[]}
        currency="USD"
      />,
    )
    expect(screen.getByText('Uncategorized')).toBeInTheDocument()
    expect(screen.getByText('$10.00')).toBeInTheDocument()
    expect(screen.queryByText('No spending yet.')).not.toBeInTheDocument()
  })
})
