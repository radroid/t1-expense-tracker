import { useState } from 'react'
import type { ExpenseInput } from '../lib/expense'
import './AddExpenseForm.css'

interface AddExpenseFormProps {
  onAdd: (input: ExpenseInput) => void
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10)
}

export function AddExpenseForm({ onAdd }: AddExpenseFormProps) {
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [date, setDate] = useState(todayISO)
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

    onAdd({
      amount: parsedAmount,
      description: trimmedDescription,
      date,
    })

    setError('')
    setAmount('')
    setDescription('')
  }

  return (
    <form className="add-expense-form" onSubmit={handleSubmit}>
      <div className="add-expense-form__field">
        <label htmlFor="add-expense-amount">Amount</label>
        <input
          id="add-expense-amount"
          type="number"
          step="any"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
      </div>

      <div className="add-expense-form__field">
        <label htmlFor="add-expense-description">Description</label>
        <input
          id="add-expense-description"
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      <div className="add-expense-form__field">
        <label htmlFor="add-expense-date">Date</label>
        <input
          id="add-expense-date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
      </div>

      {error && (
        <p className="add-expense-form__error" role="alert">
          {error}
        </p>
      )}

      <button type="submit">Add expense</button>
    </form>
  )
}
