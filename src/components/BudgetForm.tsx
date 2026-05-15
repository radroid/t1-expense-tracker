import { useState } from 'react'
import './BudgetForm.css'

interface BudgetFormProps {
  month: string
  currentAmount: number | undefined
  onSubmit: (month: string, amount: number) => void
}

// Controlled form to set the budget for a given month. The parent is
// expected to pass `key={month}` so switching months remounts the form
// and resets the input to the new `currentAmount` — same pattern App.tsx
// already uses elsewhere for month-bound state.
export function BudgetForm({ month, currentAmount, onSubmit }: BudgetFormProps) {
  const [amount, setAmount] = useState(
    currentAmount !== undefined ? String(currentAmount) : '',
  )
  const [error, setError] = useState('')

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    const parsed = Number(amount)
    if (amount.trim() === '' || Number.isNaN(parsed)) {
      setError('Please enter a valid amount.')
      return
    }
    if (!Number.isFinite(parsed) || parsed <= 0) {
      setError('Amount must be greater than 0.')
      return
    }

    onSubmit(month, parsed)
    setError('')
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
        />
      </div>

      {error && (
        <p className="budget-form__error" role="alert">
          {error}
        </p>
      )}

      <div className="budget-form__actions">
        <button type="submit">Set budget</button>
      </div>
    </form>
  )
}
