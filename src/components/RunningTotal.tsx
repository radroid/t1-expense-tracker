import type { Expense } from '../lib/expense'
import { totalAmount } from '../lib/totals'
import { formatCurrency, type CurrencyCode } from '../lib/currency'
import './RunningTotal.css'

interface RunningTotalProps {
  expenses: Expense[]
  currency: CurrencyCode
}

export function RunningTotal({ expenses, currency }: RunningTotalProps) {
  return (
    <p className="running-total">
      <span className="running-total__label">Total</span>
      <span className="running-total__amount">
        {formatCurrency(totalAmount(expenses), currency)}
      </span>
    </p>
  )
}
