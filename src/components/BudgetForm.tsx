import { useState } from 'react'
import { FieldError } from './FieldError'
import './BudgetForm.css'

interface BudgetFormProps {
  month: string
  currentAmount: number | undefined
  onSubmit: (month: string, amount: number) => void
}

// Discriminated state for which field caused the last validation
// failure. Today the budget form is single-field (amount), but expressing
// it as a tagged union keeps the wiring shape identical to the multi-field
// forms (a11y-P1 TD.18) and leaves room for future fields without a flag
// day on the alert/aria-invalid association.
type ErrorField = 'amount' | null

const ERROR_ID = 'budget-form-error'

// Controlled form to set the budget for a given month. The parent is
// expected to pass `key={month}` so switching months remounts the form
// and resets the input to the new `currentAmount` — same pattern App.tsx
// already uses elsewhere for month-bound state.
export function BudgetForm({ month, currentAmount, onSubmit }: BudgetFormProps) {
  const [amount, setAmount] = useState(
    currentAmount !== undefined ? String(currentAmount) : '',
  )
  const [error, setError] = useState('')
  const [errorField, setErrorField] = useState<ErrorField>(null)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    const parsed = Number(amount)
    if (amount.trim() === '' || Number.isNaN(parsed)) {
      setError('Please enter a valid amount.')
      setErrorField('amount')
      return
    }
    if (!Number.isFinite(parsed) || parsed <= 0) {
      setError('Amount must be greater than 0.')
      setErrorField('amount')
      return
    }

    onSubmit(month, parsed)
    setError('')
    setErrorField(null)
  }

  return (
    <form className="budget-form" onSubmit={handleSubmit}>
      <div className="budget-form__field">
        <label htmlFor="budget-form-amount">Budget amount</label>
        <input
          id="budget-form-amount"
          type="number"
          step="any"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          aria-invalid={errorField === 'amount' ? true : undefined}
          aria-describedby={ERROR_ID}
        />
      </div>

      <FieldError id={ERROR_ID} message={error === '' ? null : error} />

      <div className="budget-form__actions">
        <button type="submit">Set budget</button>
      </div>
    </form>
  )
}
