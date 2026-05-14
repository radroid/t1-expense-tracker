import { useState } from 'react'
import type { ExpenseInput } from '../lib/expense'
import './ExpenseForm.css'

interface ExpenseFormProps {
  initial?: ExpenseInput
  submitLabel: string
  onSubmit: (input: ExpenseInput) => void
  onCancel?: () => void
  clearOnSubmit?: boolean
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10)
}

export function ExpenseForm({
  initial,
  submitLabel,
  onSubmit,
  onCancel,
  clearOnSubmit,
}: ExpenseFormProps) {
  const [amount, setAmount] = useState(
    initial ? String(initial.amount) : '',
  )
  const [description, setDescription] = useState(initial?.description ?? '')
  const [date, setDate] = useState(initial ? initial.date : todayISO)
  const [error, setError] = useState('')

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    const trimmedDescription = description.trim()
    const parsedAmount = Number(amount)

    if (amount.trim() === '' || Number.isNaN(parsedAmount)) {
      setError('Please enter a valid amount.')
      return
    }
    if (trimmedDescription === '') {
      setError('Please enter a description.')
      return
    }
    if (date === '') {
      setError('Please enter a date.')
      return
    }

    onSubmit({
      amount: parsedAmount,
      description: trimmedDescription,
      date,
    })

    setError('')

    if (clearOnSubmit) {
      setAmount('')
      setDescription('')
    }
  }

  return (
    <form className="expense-form" onSubmit={handleSubmit}>
      <div className="expense-form__field">
        <label htmlFor="expense-form-amount">Amount</label>
        <input
          id="expense-form-amount"
          type="number"
          step="any"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
      </div>

      <div className="expense-form__field">
        <label htmlFor="expense-form-description">Description</label>
        <input
          id="expense-form-description"
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      <div className="expense-form__field">
        <label htmlFor="expense-form-date">Date</label>
        <input
          id="expense-form-date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
      </div>

      {error && (
        <p className="expense-form__error" role="alert">
          {error}
        </p>
      )}

      <div className="expense-form__actions">
        <button type="submit">{submitLabel}</button>
        {onCancel && (
          <button type="button" onClick={onCancel}>
            Cancel
          </button>
        )}
      </div>
    </form>
  )
}
