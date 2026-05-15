import type { BudgetStatus } from '../lib/budgetStatus'
import { formatCurrency, type CurrencyCode } from '../lib/currency'
import './BudgetVsActual.css'

interface BudgetVsActualProps {
  status: BudgetStatus
  currency: CurrencyCode
}

// Pure renderer. Two visual modes:
//  - !hasBudget → simple "no budget set" message
//  - hasBudget  → budget/actual amounts, a progress bar (clamped to 100% for
//                 width, red when over), a remaining/over readout, and a
//                 role="alert" warning when over budget.
export function BudgetVsActual({ status, currency }: BudgetVsActualProps) {
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
          {formatCurrency(status.budget, currency)}
        </span>
      </div>
      <div className="budget-vs-actual__row">
        <span className="budget-vs-actual__label">Spent</span>
        <span className="budget-vs-actual__value">
          {formatCurrency(status.actual, currency)}
        </span>
      </div>

      <div
        className="budget-vs-actual__bar-track"
        role="progressbar"
        aria-label="Budget used"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.min(100, Math.round(status.ratio * 100))}
        aria-valuetext={`${formatCurrency(status.actual, currency)} of ${formatCurrency(status.budget, currency)}`}
      >
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
          ? `${formatCurrency(remainingAbs, currency)} over`
          : `${formatCurrency(status.remaining, currency)} left`}
      </p>

      {status.isOver && (
        <p className="budget-vs-actual__warning" role="alert">
          Over budget by {formatCurrency(remainingAbs, currency)}
        </p>
      )}
    </div>
  )
}
