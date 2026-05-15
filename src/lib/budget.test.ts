import { describe, it, expect } from 'vitest';
import { createMonthlyBudget } from './budget';
import type { MonthlyBudgetInput } from './budget';

const validInput: MonthlyBudgetInput = {
  month: '2026-05',
  amount: 500,
};

describe('createMonthlyBudget', () => {
  it('creates a valid budget', () => {
    const budget = createMonthlyBudget(validInput);
    expect(budget.month).toBe('2026-05');
    expect(budget.amount).toBe(500);
  });

  it('throws when amount is NaN', () => {
    expect(() => createMonthlyBudget({ ...validInput, amount: NaN })).toThrow();
  });

  it('throws when amount is Infinity', () => {
    expect(() => createMonthlyBudget({ ...validInput, amount: Infinity })).toThrow();
  });

  it('throws when amount is zero', () => {
    expect(() => createMonthlyBudget({ ...validInput, amount: 0 })).toThrow();
  });

  it('throws when amount is negative', () => {
    expect(() => createMonthlyBudget({ ...validInput, amount: -1 })).toThrow();
  });

  it('throws when month is malformed (2026-13)', () => {
    expect(() => createMonthlyBudget({ ...validInput, month: '2026-13' })).toThrow();
  });

  it('throws when month is malformed (2026-5)', () => {
    expect(() => createMonthlyBudget({ ...validInput, month: '2026-5' })).toThrow();
  });

  it('throws when month is malformed (2026-00)', () => {
    expect(() => createMonthlyBudget({ ...validInput, month: '2026-00' })).toThrow();
  });

  it('throws when month is empty', () => {
    expect(() => createMonthlyBudget({ ...validInput, month: '' })).toThrow();
  });

  it('throws when month is non-date string', () => {
    expect(() => createMonthlyBudget({ ...validInput, month: 'not-a-month' })).toThrow();
  });

  it('accepts boundary month 2026-01', () => {
    const budget = createMonthlyBudget({ ...validInput, month: '2026-01' });
    expect(budget.month).toBe('2026-01');
  });

  it('accepts boundary month 2026-12', () => {
    const budget = createMonthlyBudget({ ...validInput, month: '2026-12' });
    expect(budget.month).toBe('2026-12');
  });
});
