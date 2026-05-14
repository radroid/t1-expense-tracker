import { useEffect, useState } from 'react'
import { createExpense, type Expense, type ExpenseInput } from './lib/expense'
import { addExpense, getAllExpenses } from './db/expenseStore'
import { AddExpenseForm } from './components/AddExpenseForm'
import './App.css'

function App() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    getAllExpenses()
      .then(setExpenses)
      .catch(() => setError('Failed to load expenses.'))
      .finally(() => setLoading(false))
  }, [])

  async function handleAdd(input: ExpenseInput) {
    let expense: Expense
    try {
      expense = createExpense(input)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Invalid expense.')
      return
    }
    setError('')
    await addExpense(expense)
    setExpenses(await getAllExpenses())
  }

  return (
    <main className="app">
      <h1>Expense Tracker</h1>
      <AddExpenseForm onAdd={handleAdd} />
      {error && (
        <p className="app__error" role="alert">
          {error}
        </p>
      )}
      {loading ? (
        <p className="loading">Loading…</p>
      ) : expenses.length === 0 ? (
        <p className="empty">No expenses yet.</p>
      ) : (
        <ul className="expense-list">
          {expenses.map((e) => (
            <li key={e.id}>
              {e.date} — {e.description} — ${e.amount.toFixed(2)}
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}

export default App
