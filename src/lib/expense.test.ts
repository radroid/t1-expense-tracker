import { describe, it, expect } from 'vitest';
import { createExpense } from './expense';
import type { ExpenseInput } from './expense';

const validInput: ExpenseInput = {
  amount: 12.5,
  description: 'Coffee',
  date: '2026-05-14',
};

describe('createExpense', () => {
  it('returns an Expense with generated id and copied fields', () => {
    const expense = createExpense(validInput);
    expect(typeof expense.id).toBe('string');
    expect(expense.id.length).toBeGreaterThan(0);
    expect(expense.amount).toBe(12.5);
    expect(expense.description).toBe('Coffee');
    expect(expense.date).toBe('2026-05-14');
  });

  it('trims the description', () => {
    const expense = createExpense({ ...validInput, description: '  Lunch  ' });
    expect(expense.description).toBe('Lunch');
  });

  it('generates a unique id per call', () => {
    const a = createExpense(validInput);
    const b = createExpense(validInput);
    expect(a.id).not.toBe(b.id);
  });

  it('passes through optional categoryId and recurring when present', () => {
    const expense = createExpense({
      ...validInput,
      categoryId: 'cat-1',
      recurring: true,
    });
    expect(expense.categoryId).toBe('cat-1');
    expect(expense.recurring).toBe(true);
  });

  it('omits optional fields when not provided', () => {
    const expense = createExpense(validInput);
    expect(expense.categoryId).toBeUndefined();
    expect(expense.recurring).toBeUndefined();
  });

  it('throws when amount is zero', () => {
    expect(() => createExpense({ ...validInput, amount: 0 })).toThrow();
  });

  it('throws when amount is negative', () => {
    expect(() => createExpense({ ...validInput, amount: -5 })).toThrow();
  });

  it('throws when amount is NaN', () => {
    expect(() => createExpense({ ...validInput, amount: NaN })).toThrow();
  });

  it('throws when amount is Infinity', () => {
    expect(() => createExpense({ ...validInput, amount: Infinity })).toThrow();
  });

  it('throws when description is empty', () => {
    expect(() => createExpense({ ...validInput, description: '' })).toThrow();
  });

  it('throws when description is whitespace-only', () => {
    expect(() => createExpense({ ...validInput, description: '   ' })).toThrow();
  });

  it('throws when date is malformed (2026-13-40)', () => {
    expect(() => createExpense({ ...validInput, date: '2026-13-40' })).toThrow();
  });

  it('throws when date is not a date string', () => {
    expect(() => createExpense({ ...validInput, date: 'not-a-date' })).toThrow();
  });

  it('throws when date is empty', () => {
    expect(() => createExpense({ ...validInput, date: '' })).toThrow();
  });

  it('throws when date is a non-existent calendar date (2026-02-30)', () => {
    expect(() => createExpense({ ...validInput, date: '2026-02-30' })).toThrow();
  });
});
