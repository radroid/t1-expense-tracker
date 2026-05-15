import type { Expense } from '../lib/expense'
import type { Category } from '../lib/category'
import { spendingByCategory } from '../lib/categoryTotals'
import { formatUSD } from '../lib/currency'
import './SpendingByCategory.css'

interface SpendingByCategoryProps {
  expenses: Expense[]
  categories: Category[]
}

const UNCATEGORIZED_COLOR = '#9ca3af'

export function SpendingByCategory({
  expenses,
  categories,
}: SpendingByCategoryProps) {
  if (expenses.length === 0) {
    return <p className="spending-by-category__empty">No spending yet.</p>
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
              {formatUSD(row.total)}
            </span>
          </li>
        )
      })}
    </ul>
  )
}
