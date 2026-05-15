import type { Expense } from '../lib/expense'
import type { Category } from '../lib/category'
import { spendingByCategory } from '../lib/categoryTotals'
import { formatCurrency, type CurrencyCode } from '../lib/currency'
import { EmptyState } from './EmptyState'
import './SpendingByCategory.css'

interface SpendingByCategoryProps {
  expenses: Expense[]
  categories: Category[]
  currency: CurrencyCode
}

const UNCATEGORIZED_COLOR = '#9ca3af'

export function SpendingByCategory({
  expenses,
  categories,
  currency,
}: SpendingByCategoryProps) {
  if (expenses.length === 0) {
    // P6.C a11y-001: trailing period dropped — empty-state titles read as labels.
    return <EmptyState title="No spending yet" />
  }

  const rows = spendingByCategory(expenses, categories)
    .slice()
    .sort((a, b) => b.total - a.total)

  return (
    <ul className="spending-by-category">
      {rows.map((row) => {
        const isNull = row.category === null
        const key = isNull ? '__uncategorized__' : row.category!.id
        const name = isNull ? 'Uncategorized' : row.category!.name
        const color = isNull ? UNCATEGORIZED_COLOR : row.category!.color
        return (
          <li key={key} className="spending-by-category__row">
            <span
              className="spending-by-category__swatch"
              style={{ backgroundColor: color }}
              aria-hidden="true"
            />
            <span className="spending-by-category__name">{name}</span>
            <span className="spending-by-category__total">
              {formatCurrency(row.total, currency)}
            </span>
          </li>
        )
      })}
    </ul>
  )
}
