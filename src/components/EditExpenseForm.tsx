import { useState } from 'react'
import type { Expense, ExpenseInput } from '../lib/expense'
import './EditExpenseForm.css'

interface EditExpenseFormProps {
  expense: Expense
  onSave: (input: ExpenseInput) => void
  onCancel: () => void
}

export function EditExpenseForm({ expense, onSave, onCancel }: EditExpenseFormProps) {
  const [amount, setAmount] = useState(String(expense.amount))
  const [description, setDescription] = useState(expense.description)
  const [date, setDate] = useState(expense.date)
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

    onSave({
      amount: parsedAmount,
      description: trimmedDescription,
      date,
    })

    setError('')
  }

  return (
    <form className="edit-expense-form" onSubmit={handleSubmit}>
      <div className="edit-expense-form__field">
        <label htmlFor="edit-expense-amount">Amount</label>
        <input
          id="edit-expense-amount"
          type="number"
          step="any"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
      </div>

      <div className="edit-expense-form__field">
        <label htmlFor="edit-expense-description">Description</label>
        <input
          id="edit-expense-description"
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      <div className="edit-expense-form__field">
        <label htmlFor="edit-expense-date">Date</label>
        <input
          id="edit-expense-date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
      </div>

      {error && (
        <p className="edit-expense-form__error" role="alert">
          {error}
        </p>
      )}

      <div className="edit-expense-form__actions">
        <button type="submit">Save</button>
        <button type="button" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  )
}
