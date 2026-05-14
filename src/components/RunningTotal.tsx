import type { Expense } from '../lib/expense'
import { totalAmount } from '../lib/totals'
import './RunningTotal.css'

interface RunningTotalProps {
  expenses: Expense[]
}

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

export function RunningTotal({ expenses }: RunningTotalProps) {
  return (
    <p className="running-total">
      <span className="running-total__label">Total</span>
      <span className="running-total__amount">
        {currencyFormatter.format(totalAmount(expenses))}
      </span>
    </p>
  )
}
