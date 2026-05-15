import type { BudgetStatus } from '../lib/budgetStatus'
import { formatUSD } from '../lib/currency'
import './BudgetVsActual.css'

interface BudgetVsActualProps {
  status: BudgetStatus
}

// Pure renderer. Two visual modes:
//  - !hasBudget → simple "no budget set" message
//  - hasBudget  → budget/actual amounts, a progress bar (clamped to 100% for
//                 width, red when over), a remaining/over readout, and a
//                 role="alert" warning when over budget.
export function BudgetVsActual({ status }: BudgetVsActualProps) {
  if (!status.hasBudget) {
    return (
      <p className="budget-vs-actual__empty">No budget set for this month.</p>
    )
  }

  const widthPct = Math.min(status.ratio * 100, 100)
  const remainingAbs = Math.abs(status.remaining)

  return (
    <div className="budget-vs-actual">
      <div className="budget-vs-actual__row">
        <span className="budget-vs-actual__label">Budget</span>
        <span className="budget-vs-actual__value">
          {formatUSD(status.budget)}
        </span>
      </div>
      <div className="budget-vs-actual__row">
        <span className="budget-vs-actual__label">Spent</span>
        <span className="budget-vs-actual__value">
          {formatUSD(status.actual)}
        </span>
      </div>

      <div className="budget-vs-actual__bar-track">
        <div
          className={
            status.isOver
              ? 'budget-vs-actual__bar budget-vs-actual__bar--over'
              : 'budget-vs-actual__bar'
          }
          style={{ width: `${widthPct}%` }}
        />
      </div>

      <p className="budget-vs-actual__remaining">
        {status.isOver
          ? `${formatUSD(remainingAbs)} over`
          : `${formatUSD(status.remaining)} left`}
      </p>

      {status.isOver && (
        <p className="budget-vs-actual__warning" role="alert">
          Over budget by {formatUSD(remainingAbs)}
        </p>
      )}
    </div>
  )
}
