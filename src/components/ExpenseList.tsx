import type { Expense } from '../lib/expense';
import './ExpenseList.css';

interface ExpenseListProps {
  expenses: Expense[];
  onDelete?: (id: string) => void;
  onEdit?: (expense: Expense) => void;
}

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function ExpenseList({ expenses, onDelete, onEdit }: ExpenseListProps) {
  if (expenses.length === 0) {
    return <p className="expense-list__empty">No expenses yet.</p>;
  }

  // Copy before sorting — never mutate the prop array.
  // Array.prototype.sort is stable, so equal dates keep input order.
  const sorted = [...expenses].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));

  return (
    <ul className="expense-list">
      {sorted.map((expense) => (
        <li key={expense.id} className="expense-list__item">
          <span className="expense-list__amount">
            {currencyFormatter.format(expense.amount)}
          </span>
          <span className="expense-list__description">{expense.description}</span>
          <span className="expense-list__date">{expense.date}</span>
          {onEdit && (
            <button
              type="button"
              className="expense-list__edit"
              aria-label={`Edit ${expense.description}`}
              onClick={() => onEdit(expense)}
            >
              Edit
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              className="expense-list__delete"
              aria-label={`Delete ${expense.description}`}
              onClick={() => onDelete(expense.id)}
            >
              Delete
            </button>
          )}
        </li>
      ))}
    </ul>
  );
}
