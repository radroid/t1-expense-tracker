// Per-category budgets — independent from MonthlyBudget. A user might set
// "Food = $200 in 2026-05" alongside a "Total = $1500 in 2026-05" month
// budget; v1 keeps them decoupled (no implicit "month total = sum of
// per-category"). Keyed by a composite STRING `${month}|${categoryId}` so
// it slots straight into an IDB store with a plain `id` keyPath, mirroring
// the existing `monthlyBudgets` shape.

export interface CategoryBudget {
  id: string // composite: `${month}|${categoryId}`
  month: string // YYYY-MM (kept on the row for query-by-month)
  categoryId: string
  amount: number // > 0 finite
}

export interface CategoryBudgetInput {
  month: string
  categoryId: string
  amount: number
}

const MONTH_RE = /^\d{4}-(0[1-9]|1[0-2])$/

// Builds the composite id. Pure, deterministic, the ONLY place this format
// is constructed. Callers must use it; do not assemble strings inline so a
// future format change (e.g. swap separator) is a one-file edit.
export function categoryBudgetId(month: string, categoryId: string): string {
  return `${month}|${categoryId}`
}

// Validates input + builds the row. Throws on invalid:
//   - month must match /^\d{4}-(0[1-9]|1[0-2])$/ (same as MonthlyBudget)
//   - categoryId must be a non-empty trimmed string
//   - amount must be finite > 0
export function createCategoryBudget(
  input: CategoryBudgetInput,
): CategoryBudget {
  const { month, categoryId, amount } = input

  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error(`Invalid amount: must be a finite number greater than 0`)
  }

  if (!MONTH_RE.test(month)) {
    throw new Error(
      `Invalid month: must be in YYYY-MM format with month 01–12`,
    )
  }

  if (typeof categoryId !== 'string' || categoryId.trim() === '') {
    throw new Error(`Invalid categoryId: must be a non-empty string`)
  }

  return {
    id: categoryBudgetId(month, categoryId),
    month,
    categoryId,
    amount,
  }
}
