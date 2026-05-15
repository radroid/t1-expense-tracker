// Pure helper: turns (budgetAmount, actual) into a display-ready status.
// `ratio` is NOT clamped — callers can clamp for visual bar width but tests
// against it (e.g. exact-budget vs over-budget) see the raw signal.
export interface BudgetStatus {
  budget: number
  actual: number
  ratio: number
  remaining: number
  isOver: boolean
  hasBudget: boolean
}

export function computeBudgetStatus(
  budgetAmount: number | undefined,
  actual: number,
): BudgetStatus {
  const hasBudget =
    typeof budgetAmount === 'number' &&
    Number.isFinite(budgetAmount) &&
    budgetAmount > 0
  const budget = hasBudget ? (budgetAmount as number) : 0

  if (!hasBudget) {
    return {
      budget: 0,
      actual,
      ratio: 0,
      remaining: -actual,
      isOver: false,
      hasBudget: false,
    }
  }

  const ratio = actual / budget
  const remaining = budget - actual
  const isOver = actual > budget

  return { budget, actual, ratio, remaining, isOver, hasBudget: true }
}
