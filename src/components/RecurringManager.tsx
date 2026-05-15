import { useState } from 'react'
import type {
  RecurringTemplate,
  RecurringTemplateInput,
} from '../lib/recurring'
import type { Category } from '../lib/category'
import './RecurringManager.css'

interface RecurringManagerProps {
  templates: RecurringTemplate[]
  categories: Category[]
  onAdd: (input: RecurringTemplateInput) => void | Promise<unknown>
  onDelete: (id: string) => void | Promise<unknown>
}

// Lets the user define monthly recurring templates. Form layout mirrors
// CategoryManager: a list above, an add form below, inline error slot. The
// component owns nothing but its draft form state; persistence and rollover
// orchestration live in the hook + App.
export function RecurringManager({
  templates,
  categories,
  onAdd,
  onDelete,
}: RecurringManagerProps) {
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [dayOfMonth, setDayOfMonth] = useState('1')
  const [categoryId, setCategoryId] = useState<string>('')
  const [error, setError] = useState('')

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    const trimmed = description.trim()
    if (trimmed === '') {
      setError('Please enter a description.')
      return
    }

    const amountNum = Number(amount)
    if (!Number.isFinite(amountNum) || amountNum <= 0) {
      setError('Please enter an amount greater than 0.')
      return
    }

    const dayNum = Number(dayOfMonth)
    if (!Number.isInteger(dayNum) || dayNum < 1 || dayNum > 28) {
      setError('Day of month must be an integer between 1 and 28.')
      return
    }

    const input: RecurringTemplateInput = {
      description: trimmed,
      amount: amountNum,
      frequency: 'monthly',
      dayOfMonth: dayNum,
    }
    if (categoryId !== '') input.categoryId = categoryId

    onAdd(input)
    setError('')
    setDescription('')
    setAmount('')
    setDayOfMonth('1')
    setCategoryId('')
  }

  return (
    <div className="recurring-manager">
      <ul className="recurring-manager__list">
        {templates.map((t) => (
          <li key={t.id} className="recurring-manager__row">
            <span className="recurring-manager__name">{t.description}</span>
            <span className="recurring-manager__meta">
              ${t.amount.toFixed(2)} · day {t.dayOfMonth}
            </span>
            <button
              type="button"
              aria-label={`Delete ${t.description}`}
              onClick={() => onDelete(t.id)}
            >
              Delete
            </button>
          </li>
        ))}
      </ul>

      <form className="recurring-manager__add" onSubmit={handleSubmit}>
        <div className="recurring-manager__field">
          <label htmlFor="recurring-description">Template description</label>
          <input
            id="recurring-description"
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div className="recurring-manager__field">
          <label htmlFor="recurring-amount">Template amount</label>
          <input
            id="recurring-amount"
            type="number"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>

        <div className="recurring-manager__field">
          <label htmlFor="recurring-day">Day of month</label>
          {/*
            No native min/max here: jsdom's user-event triggers constraint
            validation and silently swallows the form submit, hiding our
            JS-side validation error. The handleSubmit branch is the source
            of truth for the 1..28 range anyway.
          */}
          <input
            id="recurring-day"
            type="number"
            value={dayOfMonth}
            onChange={(e) => setDayOfMonth(e.target.value)}
          />
        </div>

        <div className="recurring-manager__field">
          <label htmlFor="recurring-category">Template category</label>
          <select
            id="recurring-category"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
          >
            <option value="">(none)</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {error && (
          <p className="recurring-manager__error" role="alert">
            {error}
          </p>
        )}

        <button type="submit">Add recurring template</button>
      </form>
    </div>
  )
}
