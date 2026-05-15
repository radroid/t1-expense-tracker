import { describe, it, expect } from 'vitest';
import { createExpense, applyExpenseEdit } from './expense';
import type { Expense, ExpenseInput } from './expense';

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

  it('passes through optional categoryId when present', () => {
    const expense = createExpense({
      ...validInput,
      categoryId: 'cat-1',
    });
    expect(expense.categoryId).toBe('cat-1');
  });

  it('passes through optional sourceTemplateId when present', () => {
    const expense = createExpense({
      ...validInput,
      sourceTemplateId: 'tpl-1',
    });
    expect(expense.sourceTemplateId).toBe('tpl-1');
  });

  it('omits optional fields when not provided', () => {
    const expense = createExpense(validInput);
    expect(expense.categoryId).toBeUndefined();
    expect(expense.sourceTemplateId).toBeUndefined();
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

describe('applyExpenseEdit', () => {
  const existing: Expense = {
    id: 'expense-1',
    amount: 12.5,
    description: 'Coffee',
    date: '2026-05-14',
  };

  it('keeps the existing id', () => {
    const updated = applyExpenseEdit(existing, {
      amount: 20,
      description: 'Tea',
      date: '2026-05-15',
    });
    expect(updated.id).toBe('expense-1');
  });

  it('updates the editable fields', () => {
    const updated = applyExpenseEdit(existing, {
      amount: 20,
      description: 'Tea',
      date: '2026-05-15',
    });
    expect(updated.amount).toBe(20);
    expect(updated.description).toBe('Tea');
    expect(updated.date).toBe('2026-05-15');
  });

  it('trims the description', () => {
    const updated = applyExpenseEdit(existing, {
      amount: 20,
      description: '  Tea  ',
      date: '2026-05-15',
    });
    expect(updated.description).toBe('Tea');
  });

  it('passes through optional categoryId when present', () => {
    const updated = applyExpenseEdit(existing, {
      amount: 20,
      description: 'Tea',
      date: '2026-05-15',
      categoryId: 'cat-2',
    });
    expect(updated.categoryId).toBe('cat-2');
  });

  it('preserves existing categoryId when the input omits it (TD.2)', () => {
    const withCategory: Expense = { ...existing, categoryId: 'cat-food' };
    const updated = applyExpenseEdit(withCategory, {
      amount: 20,
      description: 'Tea',
      date: '2026-05-15',
    });
    expect(updated.categoryId).toBe('cat-food');
  });

  it('preserves existing sourceTemplateId when the input omits it', () => {
    const withTemplate: Expense = { ...existing, sourceTemplateId: 'tpl-1' };
    const updated = applyExpenseEdit(withTemplate, {
      amount: 20,
      description: 'Tea',
      date: '2026-05-15',
    });
    expect(updated.sourceTemplateId).toBe('tpl-1');
  });

  it('replaces sourceTemplateId when the input explicitly supplies one', () => {
    const withTemplate: Expense = { ...existing, sourceTemplateId: 'tpl-1' };
    const updated = applyExpenseEdit(withTemplate, {
      amount: 20,
      description: 'Tea',
      date: '2026-05-15',
      sourceTemplateId: 'tpl-2',
    });
    expect(updated.sourceTemplateId).toBe('tpl-2');
  });

  it('treats explicit undefined sourceTemplateId as omission (preserves)', () => {
    const withTemplate: Expense = { ...existing, sourceTemplateId: 'tpl-1' };
    const updated = applyExpenseEdit(withTemplate, {
      amount: 20,
      description: 'Tea',
      date: '2026-05-15',
      sourceTemplateId: undefined,
    });
    expect(updated.sourceTemplateId).toBe('tpl-1');
  });

  it('treats explicit undefined the same as omission (preserves categoryId)', () => {
    const withCategory: Expense = { ...existing, categoryId: 'cat-food' };
    const updated = applyExpenseEdit(withCategory, {
      amount: 20,
      description: 'Tea',
      date: '2026-05-15',
      categoryId: undefined,
    });
    // Spreading `categoryId: undefined` keeps the existing value — the form
    // path (App.tsx) emits an explicit string id or simply omits the field;
    // it never sends `undefined` to clear. Documenting the contract: omit OR
    // pass undefined => preserve. Use '' upstream if a clearing API is ever
    // wanted, with an explicit branch.
    expect(updated.categoryId).toBe('cat-food');
  });

  it('does not mutate the existing expense', () => {
    const snapshot: Expense = { ...existing };
    applyExpenseEdit(existing, {
      amount: 99,
      description: 'Changed',
      date: '2026-12-31',
    });
    expect(existing).toEqual(snapshot);
  });

  it('throws when amount is zero', () => {
    expect(() =>
      applyExpenseEdit(existing, { amount: 0, description: 'Tea', date: '2026-05-15' }),
    ).toThrow();
  });

  it('throws when amount is negative', () => {
    expect(() =>
      applyExpenseEdit(existing, { amount: -5, description: 'Tea', date: '2026-05-15' }),
    ).toThrow();
  });

  it('throws when amount is NaN', () => {
    expect(() =>
      applyExpenseEdit(existing, { amount: NaN, description: 'Tea', date: '2026-05-15' }),
    ).toThrow();
  });

  it('throws when description is empty', () => {
    expect(() =>
      applyExpenseEdit(existing, { amount: 20, description: '', date: '2026-05-15' }),
    ).toThrow();
  });

  it('throws when description is whitespace-only', () => {
    expect(() =>
      applyExpenseEdit(existing, { amount: 20, description: '   ', date: '2026-05-15' }),
    ).toThrow();
  });

  it('throws when date is malformed', () => {
    expect(() =>
      applyExpenseEdit(existing, { amount: 20, description: 'Tea', date: '2026-13-40' }),
    ).toThrow();
  });

  it('throws when date is empty', () => {
    expect(() =>
      applyExpenseEdit(existing, { amount: 20, description: 'Tea', date: '' }),
    ).toThrow();
  });
});
