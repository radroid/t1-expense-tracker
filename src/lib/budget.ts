export interface MonthlyBudget {
  month: string;
  amount: number;
}

export interface MonthlyBudgetInput {
  month: string;
  amount: number;
}

const MONTH_RE = /^\d{4}-(0[1-9]|1[0-2])$/;

// Validates input (amount > 0 finite, month in YYYY-MM format with month
// 01–12); returns the cleaned fields. Throws on invalid.
function validateBudgetInput(input: MonthlyBudgetInput): MonthlyBudgetInput {
  const { month, amount } = input;

  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error(`Invalid amount: must be a finite number greater than 0`);
  }

  if (!MONTH_RE.test(month)) {
    throw new Error(`Invalid month: must be in YYYY-MM format with month 01–12`);
  }

  return { month, amount };
}

export function createMonthlyBudget(input: MonthlyBudgetInput): MonthlyBudget {
  return validateBudgetInput(input);
}
