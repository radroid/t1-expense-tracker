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

export function createExpense(input: ExpenseInput): Expense {
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

  const expense: Expense = {
    id: crypto.randomUUID(),
    amount,
    description: trimmedDescription,
    date,
  };

  if (categoryId !== undefined) expense.categoryId = categoryId;
  if (recurring !== undefined) expense.recurring = recurring;

  return expense;
}
