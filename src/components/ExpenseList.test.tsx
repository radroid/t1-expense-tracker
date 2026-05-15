import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import type { Expense } from '../lib/expense';
import type { Category } from '../lib/category';
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

const CATEGORIES: Category[] = [
  { id: 'cat-food', name: 'Food', color: '#ef4444' },
  { id: 'cat-transport', name: 'Transport', color: '#3b82f6' },
];

describe('ExpenseList', () => {
  it('renders all expenses passed in', () => {
    const expenses: Expense[] = [
      makeExpense({ description: 'Coffee', date: '2026-01-01' }),
      makeExpense({ description: 'Lunch', date: '2026-01-02' }),
      makeExpense({ description: 'Books', date: '2026-01-03' }),
    ];
    render(<ExpenseList expenses={expenses} categories={CATEGORIES} />);
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
    render(<ExpenseList expenses={expenses} categories={CATEGORIES} />);
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
    render(<ExpenseList expenses={expenses} categories={CATEGORIES} />);
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
    render(<ExpenseList expenses={expenses} categories={CATEGORIES} />);
    expect(expenses).toEqual(snapshot);
    expect(expenses[0].description).toBe('Oldest');
    expect(expenses[1].description).toBe('Newest');
  });

  it('formats amount as currency', () => {
    const expenses: Expense[] = [
      makeExpense({ description: 'Big', amount: 1234.5 }),
    ];
    render(<ExpenseList expenses={expenses} categories={CATEGORIES} />);
    expect(screen.getByText('$1,234.50')).toBeInTheDocument();
  });

  it('formats small/whole amounts with two decimals', () => {
    const expenses: Expense[] = [
      makeExpense({ description: 'Small', amount: 5 }),
    ];
    render(<ExpenseList expenses={expenses} categories={CATEGORIES} />);
    expect(screen.getByText('$5.00')).toBeInTheDocument();
  });

  it('renders the date for each expense', () => {
    const expenses: Expense[] = [
      makeExpense({ description: 'Dated', date: '2026-02-15' }),
    ];
    render(<ExpenseList expenses={expenses} categories={CATEGORIES} />);
    expect(screen.getByText('2026-02-15')).toBeInTheDocument();
  });

  it('shows an empty-state message when expenses is empty', () => {
    render(<ExpenseList expenses={[]} categories={CATEGORIES} />);
    expect(screen.getByText('No expenses yet.')).toBeInTheDocument();
    expect(screen.queryByRole('listitem')).not.toBeInTheDocument();
  });

  it('renders a delete button per row when onDelete is provided', () => {
    const expenses: Expense[] = [
      makeExpense({ description: 'Coffee' }),
      makeExpense({ description: 'Lunch' }),
    ];
    render(
      <ExpenseList
        expenses={expenses}
        categories={CATEGORIES}
        onDelete={vi.fn()}
      />,
    );
    expect(
      screen.getByRole('button', { name: 'Delete Coffee' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Delete Lunch' }),
    ).toBeInTheDocument();
  });

  it('calls onDelete once with the expense id when its delete button is clicked', async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn();
    const target = makeExpense({ description: 'Coffee' });
    const expenses: Expense[] = [
      target,
      makeExpense({ description: 'Lunch' }),
    ];
    render(
      <ExpenseList
        expenses={expenses}
        categories={CATEGORIES}
        onDelete={onDelete}
      />,
    );
    await user.click(screen.getByRole('button', { name: 'Delete Coffee' }));
    expect(onDelete).toHaveBeenCalledTimes(1);
    expect(onDelete).toHaveBeenCalledWith(target.id);
  });

  it('renders no delete buttons when onDelete is not provided', () => {
    const expenses: Expense[] = [
      makeExpense({ description: 'Coffee' }),
      makeExpense({ description: 'Lunch' }),
    ];
    render(<ExpenseList expenses={expenses} categories={CATEGORIES} />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('renders an edit button per row when onEdit is provided', () => {
    const expenses: Expense[] = [
      makeExpense({ description: 'Coffee' }),
      makeExpense({ description: 'Lunch' }),
    ];
    render(
      <ExpenseList
        expenses={expenses}
        categories={CATEGORIES}
        onEdit={vi.fn()}
      />,
    );
    expect(
      screen.getByRole('button', { name: 'Edit Coffee' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Edit Lunch' }),
    ).toBeInTheDocument();
  });

  it('calls onEdit once with the expense when its edit button is clicked', async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();
    const target = makeExpense({ description: 'Coffee' });
    const expenses: Expense[] = [
      target,
      makeExpense({ description: 'Lunch' }),
    ];
    render(
      <ExpenseList
        expenses={expenses}
        categories={CATEGORIES}
        onEdit={onEdit}
      />,
    );
    await user.click(screen.getByRole('button', { name: 'Edit Coffee' }));
    expect(onEdit).toHaveBeenCalledTimes(1);
    expect(onEdit).toHaveBeenCalledWith(target);
  });

  it('renders no edit buttons when onEdit is not provided', () => {
    const expenses: Expense[] = [
      makeExpense({ description: 'Coffee' }),
      makeExpense({ description: 'Lunch' }),
    ];
    render(<ExpenseList expenses={expenses} categories={CATEGORIES} />);
    expect(
      screen.queryByRole('button', { name: /^Edit / }),
    ).not.toBeInTheDocument();
  });

  describe('category badges', () => {
    it('renders a badge with the category name and color when the row has a matching categoryId', () => {
      const expenses: Expense[] = [
        makeExpense({ description: 'Coffee', categoryId: 'cat-food' }),
      ];
      render(<ExpenseList expenses={expenses} categories={CATEGORIES} />);
      const badge = screen.getByLabelText('Category: Food');
      expect(badge).toBeInTheDocument();
      expect(within(badge).getByText('Food')).toBeInTheDocument();
      const swatch = badge.querySelector('.expense-list__badge-swatch');
      expect(swatch).not.toBeNull();
      // rgb form of #ef4444
      expect((swatch as HTMLElement).style.backgroundColor).toBe(
        'rgb(239, 68, 68)',
      );
    });

    it('renders no badge when the row has no categoryId', () => {
      const expenses: Expense[] = [
        makeExpense({ description: 'Coffee' }),
      ];
      render(<ExpenseList expenses={expenses} categories={CATEGORIES} />);
      expect(screen.queryByLabelText(/^Category: /)).not.toBeInTheDocument();
    });

    it('renders no badge when the row has a categoryId that does not match any category (orphan)', () => {
      const expenses: Expense[] = [
        makeExpense({ description: 'Coffee', categoryId: 'cat-deleted' }),
      ];
      render(<ExpenseList expenses={expenses} categories={CATEGORIES} />);
      expect(screen.queryByLabelText(/^Category: /)).not.toBeInTheDocument();
    });
  });
});
