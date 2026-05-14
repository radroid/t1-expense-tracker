import { render, screen, within } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import type { Expense } from '../lib/expense';
import { ExpenseList } from './ExpenseList';

function makeExpense(overrides: Partial<Expense> = {}): Expense {
  return {
    id: crypto.randomUUID(),
    amount: 10,
    description: 'Test expense',
    date: '2026-01-01',
    ...overrides,
  };
}

describe('ExpenseList', () => {
  it('renders all expenses passed in', () => {
    const expenses: Expense[] = [
      makeExpense({ description: 'Coffee', date: '2026-01-01' }),
      makeExpense({ description: 'Lunch', date: '2026-01-02' }),
      makeExpense({ description: 'Books', date: '2026-01-03' }),
    ];
    render(<ExpenseList expenses={expenses} />);
    expect(screen.getByText('Coffee')).toBeInTheDocument();
    expect(screen.getByText('Lunch')).toBeInTheDocument();
    expect(screen.getByText('Books')).toBeInTheDocument();
  });

  it('renders order newest-first regardless of input order', () => {
    const expenses: Expense[] = [
      makeExpense({ description: 'Oldest', date: '2026-01-01' }),
      makeExpense({ description: 'Newest', date: '2026-03-01' }),
      makeExpense({ description: 'Middle', date: '2026-02-01' }),
    ];
    render(<ExpenseList expenses={expenses} />);
    const items = screen.getAllByRole('listitem');
    expect(items).toHaveLength(3);
    expect(within(items[0]).getByText('Newest')).toBeInTheDocument();
    expect(within(items[1]).getByText('Middle')).toBeInTheDocument();
    expect(within(items[2]).getByText('Oldest')).toBeInTheDocument();
  });

  it('keeps stable order for equal dates', () => {
    const expenses: Expense[] = [
      makeExpense({ description: 'First', date: '2026-01-01' }),
      makeExpense({ description: 'Second', date: '2026-01-01' }),
      makeExpense({ description: 'Third', date: '2026-01-01' }),
    ];
    render(<ExpenseList expenses={expenses} />);
    const items = screen.getAllByRole('listitem');
    expect(within(items[0]).getByText('First')).toBeInTheDocument();
    expect(within(items[1]).getByText('Second')).toBeInTheDocument();
    expect(within(items[2]).getByText('Third')).toBeInTheDocument();
  });

  it('does not mutate the prop array', () => {
    const expenses: Expense[] = [
      makeExpense({ description: 'Oldest', date: '2026-01-01' }),
      makeExpense({ description: 'Newest', date: '2026-03-01' }),
    ];
    const snapshot = [...expenses];
    render(<ExpenseList expenses={expenses} />);
    expect(expenses).toEqual(snapshot);
    expect(expenses[0].description).toBe('Oldest');
    expect(expenses[1].description).toBe('Newest');
  });

  it('formats amount as currency', () => {
    const expenses: Expense[] = [
      makeExpense({ description: 'Big', amount: 1234.5 }),
    ];
    render(<ExpenseList expenses={expenses} />);
    expect(screen.getByText('$1,234.50')).toBeInTheDocument();
  });

  it('formats small/whole amounts with two decimals', () => {
    const expenses: Expense[] = [
      makeExpense({ description: 'Small', amount: 5 }),
    ];
    render(<ExpenseList expenses={expenses} />);
    expect(screen.getByText('$5.00')).toBeInTheDocument();
  });

  it('renders the date for each expense', () => {
    const expenses: Expense[] = [
      makeExpense({ description: 'Dated', date: '2026-02-15' }),
    ];
    render(<ExpenseList expenses={expenses} />);
    expect(screen.getByText('2026-02-15')).toBeInTheDocument();
  });

  it('shows an empty-state message when expenses is empty', () => {
    render(<ExpenseList expenses={[]} />);
    expect(screen.getByText('No expenses yet.')).toBeInTheDocument();
    expect(screen.queryByRole('listitem')).not.toBeInTheDocument();
  });
});
