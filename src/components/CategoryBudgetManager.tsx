import { useState } from 'react'
import type { Category } from '../lib/category'
import type { CategoryBudget } from '../lib/categoryBudget'
import './CategoryBudgetManager.css'

interface CategoryBudgetManagerProps {
  month: string
  categories: Category[]
  // Existing per-category budgets for ALL months; this component filters
  // down to the current month for display. Passing the full list (rather
  // than a pre-filtered slice) keeps the prop surface stable across month
  // switches.
  categoryBudgets: CategoryBudget[]
  // Upsert callback — wired to useCategoryBudgets.set.
  onSet: (
    month: string,
    categoryId: string,
    amount: number,
  ) => Promise<boolean>
  // Remove by composite id — wired to useCategoryBudgets.remove.
  onRemove: (id: string) => Promise<boolean>
}

// Lists one row per category for the selected month. Each row shows the
// existing amount (if any), an editable amount input, a Save button, and a
// Remove button (only when a budget already exists for that category). One
// inline error slot for whichever row last surfaced a validation problem.
//
// The component owns only draft input state; persistence + validation live
// in the hook + the categoryBudget lib.
export function CategoryBudgetManager({
  month,
  categories,
  categoryBudgets,
  onSet,
  onRemove,
}: CategoryBudgetManagerProps) {
  // Per-row drafts; keyed by categoryId. Empty entries fall back to the
  // existing-amount placeholder.
  const [drafts, setDrafts] = useState<Record<string, string>>({})
  const [error, setError] = useState('')

  function existingFor(categoryId: string): CategoryBudget | undefined {
    return categoryBudgets.find(
      (b) => b.month === month && b.categoryId === categoryId,
    )
  }

  async function handleSave(categoryId: string) {
    const raw = drafts[categoryId] ?? ''
    if (raw.trim() === '') {
      setError('Please enter an amount.')
      return
    }
    const amountNum = Number(raw)
    if (!Number.isFinite(amountNum) || amountNum <= 0) {
      setError('Please enter an amount greater than 0.')
      return
    }

    const ok = await onSet(month, categoryId, amountNum)
    if (ok) {
      setError('')
      // Clear the draft so the existing-amount placeholder takes over again.
      setDrafts((prev) => {
        const next = { ...prev }
        delete next[categoryId]
        return next
      })
    }
  }

  if (categories.length === 0) {
    return (
      <div className="category-budget-manager">
        <p className="category-budget-manager__empty">
          Add a category first to set a per-category budget.
        </p>
      </div>
    )
  }

  return (
    <div className="category-budget-manager">
      <p className="category-budget-manager__month">For month {month}</p>
      <ul className="category-budget-manager__list">
        {categories.map((c) => {
          const existing = existingFor(c.id)
          const draftKey = c.id
          const draftValue = drafts[draftKey] ?? ''
          const placeholder =
            existing !== undefined ? existing.amount.toString() : '0.00'

          return (
            <li key={c.id} className="category-budget-manager__row">
              <span
                className="category-budget-manager__swatch"
                style={{ backgroundColor: c.color }}
                aria-hidden="true"
              />
              <span className="category-budget-manager__name">{c.name}</span>
              <input
                className="category-budget-manager__amount"
                type="number"
                step="0.01"
                aria-label={`Budget for ${c.name}`}
                placeholder={placeholder}
                value={draftValue}
                onChange={(e) =>
                  setDrafts((prev) => ({ ...prev, [draftKey]: e.target.value }))
                }
              />
              <span className="category-budget-manager__current">
                {existing !== undefined
                  ? `Current: $${existing.amount.toFixed(2)}`
                  : 'No budget set'}
              </span>
              <button
                type="button"
                aria-label={`Save budget for ${c.name}`}
                onClick={() => handleSave(c.id)}
              >
                Save
              </button>
              {existing !== undefined && (
                <button
                  type="button"
                  aria-label={`Remove budget for ${c.name}`}
                  onClick={() => onRemove(existing.id)}
                >
                  Remove
                </button>
              )}
            </li>
          )
        })}
      </ul>
      {error && (
        <p className="category-budget-manager__error" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
