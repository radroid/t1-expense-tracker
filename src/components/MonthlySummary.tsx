import type { Expense } from '../lib/expense'
import { summarizeExpenses } from '../lib/monthlyTotals'
import { formatUSD } from '../lib/currency'
import { EmptyState } from './EmptyState'
import './MonthlySummary.css'

interface MonthlySummaryProps {
  expenses: Expense[]
}

export function MonthlySummary({ expenses }: MonthlySummaryProps) {
  const { total, average, count } = summarizeExpenses(expenses)

  if (count === 0) {
    // Keeps the existing "No expenses this period." copy so callers querying by
    // that string continue to work, while delegating presentation/a11y to the
    // shared EmptyState (role=status, dashed-border zero-data card).
    return <EmptyState title="No expenses this period." />
  }

  return (
    <ul className="monthly-summary">
      <li className="monthly-summary__row">
        <span className="monthly-summary__label">Total</span>
        <span className="monthly-summary__value">{formatUSD(total)}</span>
      </li>
      <li className="monthly-summary__row">
        <span className="monthly-summary__label">Average</span>
        <span className="monthly-summary__value">{formatUSD(average)}</span>
      </li>
      <li className="monthly-summary__row">
        <span className="monthly-summary__label">Count</span>
        <span className="monthly-summary__value">{count}</span>
      </li>
    </ul>
  )
}
