import type { Expense } from '../lib/expense'
import { summarizeExpenses } from '../lib/monthlyTotals'
import { formatUSD } from '../lib/currency'
import './MonthlySummary.css'

interface MonthlySummaryProps {
  expenses: Expense[]
}

export function MonthlySummary({ expenses }: MonthlySummaryProps) {
  const { total, average, count } = summarizeExpenses(expenses)

  if (count === 0) {
    return <p className="monthly-summary__empty">No expenses this period.</p>
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
