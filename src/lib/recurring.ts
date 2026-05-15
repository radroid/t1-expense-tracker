import type { Expense, ExpenseInput } from './expense'

export type Frequency = 'monthly' // future: 'weekly' | 'yearly'

export interface RecurringTemplate {
  id: string
  description: string
  amount: number
  frequency: Frequency
  dayOfMonth: number
  categoryId?: string
}

export interface RecurringTemplateInput {
  description: string
  amount: number
  frequency: Frequency
  dayOfMonth: number
  categoryId?: string
}

// dayOfMonth is capped at 28 so we never have to reason about month-length
// edge cases (Feb 30, Apr 31). Templates pegged to "end of month" are out of
// scope for this iter; if/when added they'd extend the type (e.g. an enum
// 'last-day') rather than push dayOfMonth past 28.
const MIN_DAY = 1
const MAX_DAY = 28

function validate(input: RecurringTemplateInput): RecurringTemplateInput {
  const { description, amount, frequency, dayOfMonth, categoryId } = input

  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error('Invalid amount: must be a finite number greater than 0')
  }

  const trimmedDescription = description.trim()
  if (trimmedDescription.length === 0) {
    throw new Error('Invalid description: must be non-empty')
  }

  if (frequency !== 'monthly') {
    throw new Error(`Invalid frequency: only 'monthly' is supported`)
  }

  if (
    !Number.isInteger(dayOfMonth) ||
    dayOfMonth < MIN_DAY ||
    dayOfMonth > MAX_DAY
  ) {
    throw new Error(
      `Invalid dayOfMonth: must be an integer between ${MIN_DAY} and ${MAX_DAY}`,
    )
  }

  const cleaned: RecurringTemplateInput = {
    description: trimmedDescription,
    amount,
    frequency,
    dayOfMonth,
  }
  if (categoryId !== undefined) cleaned.categoryId = categoryId
  return cleaned
}

export function createRecurringTemplate(
  input: RecurringTemplateInput,
): RecurringTemplate {
  const cleaned = validate(input)
  return { id: crypto.randomUUID(), ...cleaned }
}

// Applies an edit. Preserves `id` from existing. `frequency` is always
// 'monthly' (and validated to be so), so functionally the existing value
// survives. Mirrors `applyExpenseEdit` semantics for optional fields: if the
// input omits categoryId OR sets it explicitly to undefined, the existing
// categoryId is preserved. To replace categoryId, pass the new value; to
// clear it, that must be an explicit upstream branch rather than relying
// on undefined-equals-clear.
export function applyRecurringTemplateEdit(
  existing: RecurringTemplate,
  input: RecurringTemplateInput,
): RecurringTemplate {
  const cleaned = validate(input)
  const merged: RecurringTemplate = { id: existing.id, ...cleaned }
  if (cleaned.categoryId === undefined && existing.categoryId !== undefined) {
    merged.categoryId = existing.categoryId
  }
  return merged
}

// Pure. Returns templates that have no matching expense for `month`. A match
// requires both sourceTemplateId === template.id AND date in that month (the
// first seven chars of the YYYY-MM-DD string). Input order preserved.
export function dueTemplatesForMonth(
  templates: readonly RecurringTemplate[],
  expenses: readonly Expense[],
  month: string,
): RecurringTemplate[] {
  const matchedIds = new Set<string>()
  for (const e of expenses) {
    if (!e.sourceTemplateId) continue
    if (e.date.slice(0, 7) !== month) continue
    matchedIds.add(e.sourceTemplateId)
  }
  return templates.filter((t) => !matchedIds.has(t.id))
}

// Pure. One ExpenseInput per template, dated `${month}-${dayOfMonth padded}`.
// Carries categoryId if present and attaches sourceTemplateId so the next
// dueTemplatesForMonth call sees the new expense as a match (idempotency).
export function generateDueExpenses(
  templates: readonly RecurringTemplate[],
  month: string,
): Array<ExpenseInput & { sourceTemplateId: string }> {
  return templates.map((t) => {
    const day = String(t.dayOfMonth).padStart(2, '0')
    const input: ExpenseInput & { sourceTemplateId: string } = {
      amount: t.amount,
      description: t.description,
      date: `${month}-${day}`,
      sourceTemplateId: t.id,
    }
    if (t.categoryId !== undefined) input.categoryId = t.categoryId
    return input
  })
}
