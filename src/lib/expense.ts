export interface Expense {
  id: string;
  amount: number;
  description: string;
  date: string;
  categoryId?: string;
  recurring?: boolean;
}

export interface ExpenseInput {
  amount: number;
  description: string;
  date: string;
  categoryId?: string;
  recurring?: boolean;
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function isRealCalendarDate(date: string): boolean {
  const [year, month, day] = date.split('-').map(Number);
  const d = new Date(Date.UTC(year, month - 1, day));
  return (
    d.getUTCFullYear() === year &&
    d.getUTCMonth() === month - 1 &&
    d.getUTCDate() === day
  );
}

// Validates input (amount > 0 finite, non-empty trimmed description, real
// YYYY-MM-DD date); returns the cleaned fields. Throws on invalid.
function validateExpenseInput(input: ExpenseInput): ExpenseInput {
  const { amount, description, date, categoryId, recurring } = input;

  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error(`Invalid amount: must be a finite number greater than 0`);
  }

  const trimmedDescription = description.trim();
  if (trimmedDescription.length === 0) {
    throw new Error('Invalid description: must be non-empty');
  }

  if (!DATE_RE.test(date) || !isRealCalendarDate(date)) {
    throw new Error(`Invalid date: must be a real calendar date in YYYY-MM-DD format`);
  }

  const cleaned: ExpenseInput = {
    amount,
    description: trimmedDescription,
    date,
  };

  if (categoryId !== undefined) cleaned.categoryId = categoryId;
  if (recurring !== undefined) cleaned.recurring = recurring;

  return cleaned;
}

export function createExpense(input: ExpenseInput): Expense {
  const cleaned = validateExpenseInput(input);
  return { id: crypto.randomUUID(), ...cleaned };
}

// Applies an edit, preserving optional fields the input doesn't mention.
//
// Contract: `categoryId` and `recurring` survive an edit unless the input
// *explicitly* supplies a new value. Omitting them (or passing `undefined`)
// keeps the existing value — important for forms that don't render every
// field (e.g. a recurring toggle absent from the basic edit form would
// silently wipe the flag otherwise). To replace a value, pass the new one;
// to clear it, the form must do so through an explicit upstream branch
// rather than relying on undefined-equals-clear.
export function applyExpenseEdit(existing: Expense, input: ExpenseInput): Expense {
  const cleaned = validateExpenseInput(input);
  const merged: Expense = { id: existing.id, ...cleaned };
  if (cleaned.categoryId === undefined && existing.categoryId !== undefined) {
    merged.categoryId = existing.categoryId;
  }
  if (cleaned.recurring === undefined && existing.recurring !== undefined) {
    merged.recurring = existing.recurring;
  }
  return merged;
}
