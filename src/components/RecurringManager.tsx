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
  // Optional for the same reason as `onAddMany` — App.tsx is wired by the
  // main agent and the prop may not be provided everywhere yet. Without
  // it, the Edit affordance still renders, but Save is a no-op (logs
  // a console.warn rather than crashing).
  onUpdate?: (
    existing: RecurringTemplate,
    input: RecurringTemplateInput,
  ) => Promise<boolean>
  onDelete: (id: string) => Promise<boolean>
}

type ErrorField = 'description' | 'amount' | 'dayOfMonth' | null

const ERROR_ID = 'recurring-manager-error'
const EDIT_ERROR_ID = 'recurring-manager-edit-error'

const noopAddMany = async (): Promise<RecurringBulkAddResult> => ({
  added: 0,
  skipped: 0,
  errors: [],
})

interface ParsedInput {
  ok: true
  input: RecurringTemplateInput
}
interface ParseError {
  ok: false
  message: string
  field: ErrorField
}

// Pulled out so the add form and the edit form validate identically. Returns
// either a cleaned RecurringTemplateInput or a per-field error message.
function parseDraft(
  description: string,
  amount: string,
  dayOfMonth: string,
  categoryId: string,
): ParsedInput | ParseError {
  const trimmed = description.trim()
  if (trimmed === '') {
    return {
      ok: false,
      message: 'Please enter a description.',
      field: 'description',
    }
  }

  const amountNum = Number(amount)
  if (!Number.isFinite(amountNum) || amountNum <= 0) {
    return {
      ok: false,
      message: 'Please enter an amount greater than 0.',
      field: 'amount',
    }
  }

  const dayNum = Number(dayOfMonth)
  if (!Number.isInteger(dayNum) || dayNum < 1 || dayNum > 28) {
    return {
      ok: false,
      message: 'Day of month must be an integer between 1 and 28.',
      field: 'dayOfMonth',
    }
  }

  const input: RecurringTemplateInput = {
    description: trimmed,
    amount: amountNum,
    frequency: 'monthly',
    dayOfMonth: dayNum,
  }
  if (categoryId !== '') input.categoryId = categoryId
  return { ok: true, input }
}

// Lets the user define monthly recurring templates. Form layout mirrors
// CategoryManager: a list above, an add form below, inline error slot. The
// component owns nothing but its draft form state; persistence and rollover
// orchestration live in the hook + App.
export function RecurringManager({
  templates,
  categories,
  onAdd,
  onAddMany = noopAddMany,
  onUpdate,
  onDelete,
}: RecurringManagerProps) {
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [dayOfMonth, setDayOfMonth] = useState('1')
  const [categoryId, setCategoryId] = useState<string>('')
  const [error, setError] = useState('')
  const [errorField, setErrorField] = useState<ErrorField>(null)

  // Per-row edit state. `editingId` is the template id currently in edit
  // mode (or null). Draft fields are scoped to the edit form so cancel can
  // discard cleanly without resetting the add form's state.
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editDescription, setEditDescription] = useState('')
  const [editAmount, setEditAmount] = useState('')
  const [editDayOfMonth, setEditDayOfMonth] = useState('1')
  const [editCategoryId, setEditCategoryId] = useState<string>('')
  const [editError, setEditError] = useState('')
  const [editErrorField, setEditErrorField] = useState<ErrorField>(null)

  function startEdit(t: RecurringTemplate) {
    setEditingId(t.id)
    setEditDescription(t.description)
    setEditAmount(String(t.amount))
    setEditDayOfMonth(String(t.dayOfMonth))
    setEditCategoryId(t.categoryId ?? '')
    setEditError('')
    setEditErrorField(null)
  }

  function cancelEdit() {
    setEditingId(null)
    setEditError('')
    setEditErrorField(null)
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    const parsed = parseDraft(description, amount, dayOfMonth, categoryId)
    if (!parsed.ok) {
      setError(parsed.message)
      setErrorField(parsed.field)
      return
    }

    // Await the upstream add — only clear the form on success so a
    // persistence failure doesn't lose the user's input. The upstream
    // hook surfaces its own error string; we just clear our local
    // validation error so the inline alert disappears once the network
    // request is in flight.
    const ok = await onAdd(parsed.input)
    if (ok) {
      setError('')
      setErrorField(null)
      setDescription('')
      setAmount('')
      setDayOfMonth('1')
      setCategoryId('')
    }
  }

  async function handleSaveEdit(
    e: React.FormEvent<HTMLFormElement>,
    existing: RecurringTemplate,
  ) {
    e.preventDefault()

    const parsed = parseDraft(
      editDescription,
      editAmount,
      editDayOfMonth,
      editCategoryId,
    )
    if (!parsed.ok) {
      setEditError(parsed.message)
      setEditErrorField(parsed.field)
      return
    }

    if (!onUpdate) {
      // Prop not wired — stay in edit mode and surface a hint. This branch
      // is defensive; tests that exercise edit always pass onUpdate.
      setEditError('Update is not available.')
      return
    }

    const ok = await onUpdate(existing, parsed.input)
    if (ok) {
      cancelEdit()
    }
  }

  return (
    <div className="recurring-manager">
      <div className="recurring-manager__io">
        <RecurringExport templates={templates} />
        <RecurringImport onImport={onAddMany} />
      </div>
      <ul className="recurring-manager__list">
        {templates.map((t) => {
          const isEditing = editingId === t.id
          if (isEditing) {
            return (
              <li
                key={t.id}
                className="recurring-manager__row recurring-manager__row--editing"
              >
                <form
                  className="recurring-manager__edit"
                  onSubmit={(e) => handleSaveEdit(e, t)}
                >
                  <div className="recurring-manager__field">
                    <label htmlFor={`recurring-edit-description-${t.id}`}>
                      Edit description
                    </label>
                    <input
                      id={`recurring-edit-description-${t.id}`}
                      type="text"
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      aria-invalid={
                        editErrorField === 'description' ? true : undefined
                      }
                      aria-describedby={EDIT_ERROR_ID}
                    />
                  </div>

                  <div className="recurring-manager__field">
                    <label htmlFor={`recurring-edit-amount-${t.id}`}>
                      Edit amount
                    </label>
                    <input
                      id={`recurring-edit-amount-${t.id}`}
                      type="number"
                      step="0.01"
                      value={editAmount}
                      onChange={(e) => setEditAmount(e.target.value)}
                      aria-invalid={
                        editErrorField === 'amount' ? true : undefined
                      }
                      aria-describedby={EDIT_ERROR_ID}
                    />
                  </div>

                  <div className="recurring-manager__field">
                    <label htmlFor={`recurring-edit-day-${t.id}`}>
                      Edit day of month
                    </label>
                    <input
                      id={`recurring-edit-day-${t.id}`}
                      type="number"
                      value={editDayOfMonth}
                      onChange={(e) => setEditDayOfMonth(e.target.value)}
                      aria-invalid={
                        editErrorField === 'dayOfMonth' ? true : undefined
                      }
                      aria-describedby={EDIT_ERROR_ID}
                    />
                  </div>

                  <div className="recurring-manager__field">
                    <label htmlFor={`recurring-edit-category-${t.id}`}>
                      Edit category
                    </label>
                    <select
                      id={`recurring-edit-category-${t.id}`}
                      value={editCategoryId}
                      onChange={(e) => setEditCategoryId(e.target.value)}
                    >
                      <option value="">(none)</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <FieldError
                    id={EDIT_ERROR_ID}
                    message={editError === '' ? null : editError}
                  />

                  <div className="recurring-manager__edit-actions">
                    <button type="submit">Save</button>
                    <button type="button" onClick={cancelEdit}>
                      Cancel
                    </button>
                  </div>
                </form>
              </li>
            )
          }
          return (
            <li key={t.id} className="recurring-manager__row">
              <span className="recurring-manager__name">{t.description}</span>
              <span className="recurring-manager__meta">
                ${t.amount.toFixed(2)} · day {t.dayOfMonth}
              </span>
              <button
                type="button"
                aria-label={`Edit ${t.description}`}
                onClick={() => startEdit(t)}
              >
                Edit
              </button>
              <button
                type="button"
                aria-label={`Delete ${t.description}`}
                onClick={() => onDelete(t.id)}
              >
                Delete
              </button>
            </li>
          )
        })}
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
