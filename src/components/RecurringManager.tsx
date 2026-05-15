import { useState } from 'react'
import type {
  RecurringTemplate,
  RecurringTemplateInput,
} from '../lib/recurring'
import type { Category } from '../lib/category'
import type { RecurringBulkAddResult } from '../hooks/useRecurringTemplates'
import { RecurringExport } from './RecurringExport'
import { RecurringImport } from './RecurringImport'
import { FieldError } from './FieldError'
import './RecurringManager.css'

interface RecurringManagerProps {
  templates: RecurringTemplate[]
  categories: Category[]
  onAdd: (input: RecurringTemplateInput) => Promise<boolean>
  // Optional so the main agent can wire this at the App level without
  // a flag-day rename — the import control degrades to a no-op summary
  // when omitted. Tests assert behavior when the prop IS provided.
  onAddMany?: (
    inputs: RecurringTemplateInput[],
  ) => Promise<RecurringBulkAddResult>
  onDelete: (id: string) => Promise<boolean>
}

type ErrorField = 'description' | 'amount' | 'dayOfMonth' | null

const ERROR_ID = 'recurring-manager-error'

const noopAddMany = async (): Promise<RecurringBulkAddResult> => ({
  added: 0,
  skipped: 0,
  errors: [],
})

// Lets the user define monthly recurring templates. Form layout mirrors
// CategoryManager: a list above, an add form below, inline error slot. The
// component owns nothing but its draft form state; persistence and rollover
// orchestration live in the hook + App.
export function RecurringManager({
  templates,
  categories,
  onAdd,
  onAddMany = noopAddMany,
  onDelete,
}: RecurringManagerProps) {
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [dayOfMonth, setDayOfMonth] = useState('1')
  const [categoryId, setCategoryId] = useState<string>('')
  const [error, setError] = useState('')
  const [errorField, setErrorField] = useState<ErrorField>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    const trimmed = description.trim()
    if (trimmed === '') {
      setError('Please enter a description.')
      setErrorField('description')
      return
    }

    const amountNum = Number(amount)
    if (!Number.isFinite(amountNum) || amountNum <= 0) {
      setError('Please enter an amount greater than 0.')
      setErrorField('amount')
      return
    }

    const dayNum = Number(dayOfMonth)
    if (!Number.isInteger(dayNum) || dayNum < 1 || dayNum > 28) {
      setError('Day of month must be an integer between 1 and 28.')
      setErrorField('dayOfMonth')
      return
    }

    const input: RecurringTemplateInput = {
      description: trimmed,
      amount: amountNum,
      frequency: 'monthly',
      dayOfMonth: dayNum,
    }
    if (categoryId !== '') input.categoryId = categoryId

    // Await the upstream add — only clear the form on success so a
    // persistence failure doesn't lose the user's input. The upstream
    // hook surfaces its own error string; we just clear our local
    // validation error so the inline alert disappears once the network
    // request is in flight.
    const ok = await onAdd(input)
    if (ok) {
      setError('')
      setErrorField(null)
      setDescription('')
      setAmount('')
      setDayOfMonth('1')
      setCategoryId('')
    }
  }

  return (
    <div className="recurring-manager">
      <div className="recurring-manager__io">
        <RecurringExport templates={templates} />
        <RecurringImport onImport={onAddMany} />
      </div>
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
            aria-invalid={errorField === 'description' ? true : undefined}
            aria-describedby={ERROR_ID}
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
            aria-invalid={errorField === 'amount' ? true : undefined}
            aria-describedby={ERROR_ID}
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
            aria-invalid={errorField === 'dayOfMonth' ? true : undefined}
            aria-describedby={ERROR_ID}
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

        <FieldError id={ERROR_ID} message={error === '' ? null : error} />

        <button type="submit">Add recurring template</button>
      </form>
    </div>
  )
}
