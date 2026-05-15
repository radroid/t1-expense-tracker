import type { Expense } from '../lib/expense'
import { summarizeExpenses } from '../lib/monthlyTotals'
import { formatCurrency, type CurrencyCode } from '../lib/currency'
import { EmptyState } from './EmptyState'
import './MonthlySummary.css'

interface MonthlySummaryProps {
  expenses: Expense[]
  currency: CurrencyCode
}

export function MonthlySummary({ expenses, currency }: MonthlySummaryProps) {
  const { total, average, count } = summarizeExpenses(expenses)

  if (count === 0) {
    // P6.C a11y-001: trailing period dropped — empty-state titles read as
    // labels, not sentences. Presentation/a11y delegated to the shared
    // EmptyState (role=status, dashed-border zero-data card).
    return <EmptyState title="No expenses this period" />
  }

  return (
    <ul className="monthly-summary">
      <li className="monthly-summary__row">
        <span className="monthly-summary__label">Total</span>
        <span className="monthly-summary__value">{formatCurrency(total, currency)}</span>
      </li>
      <li className="monthly-summary__row">
        <span className="monthly-summary__label">Average</span>
        <span className="monthly-summary__value">{formatCurrency(average, currency)}</span>
      </li>
      <li className="monthly-summary__row">
        <span className="monthly-summary__label">Count</span>
        <span className="monthly-summary__value">{count}</span>
      </li>
    </ul>
  )
}
