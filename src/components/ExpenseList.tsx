import type { Expense } from '../lib/expense';
import type { Category } from '../lib/category';
import { formatUSD } from '../lib/currency';
import { EmptyState } from './EmptyState';
import './ExpenseList.css';

interface ExpenseListProps {
  expenses: Expense[];
  categories: Category[];
  onDelete?: (id: string) => void;
  onEdit?: (expense: Expense) => void;
}

export function ExpenseList({ expenses, categories, onDelete, onEdit }: ExpenseListProps) {
  if (expenses.length === 0) {
    // Title keeps the existing "No expenses yet." copy so App-level integration
    // tests (which findByText that string) keep working.
    return (
      <EmptyState
        title="No expenses yet."
        hint="Add one with the form above"
      />
    );
  }

  // Copy before sorting — never mutate the prop array.
  // Array.prototype.sort is stable, so equal dates keep input order.
  const sorted = [...expenses].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));

  const categoryById = new Map(categories.map((c) => [c.id, c]));

  return (
    <ul className="expense-list">
      {sorted.map((expense) => {
        const category = expense.categoryId
          ? categoryById.get(expense.categoryId)
          : undefined;
        return (
          <li key={expense.id} className="expense-list__item">
            <span className="expense-list__amount">
              {formatUSD(expense.amount)}
            </span>
            <span className="expense-list__description">{expense.description}</span>
            {category ? (
              <span
                className="expense-list__badge"
                aria-label={`Category: ${category.name}`}
              >
                <span
                  className="expense-list__badge-swatch"
                  style={{ backgroundColor: category.color }}
                  aria-hidden="true"
                />
                <span className="expense-list__badge-name">{category.name}</span>
              </span>
            ) : (
              <span aria-hidden="true" />
            )}
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
        );
      })}
    </ul>
  );
}
