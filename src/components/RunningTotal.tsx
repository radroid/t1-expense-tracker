import type { Expense } from '../lib/expense'
import { totalAmount } from '../lib/totals'
import { formatUSD } from '../lib/currency'
import './RunningTotal.css'

interface RunningTotalProps {
  expenses: Expense[]
}

export function RunningTotal({ expenses }: RunningTotalProps) {
  return (
    <p className="running-total">
      <span className="running-total__label">Total</span>
      <span className="running-total__amount">
        {formatUSD(totalAmount(expenses))}
      </span>
    </p>
  )
}
