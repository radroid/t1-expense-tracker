import { useEffect, useState } from 'react'
import { createExpense, type Expense, type ExpenseInput } from './lib/expense'
import { addExpense, getAllExpenses, removeExpense } from './db/expenseStore'
import { AddExpenseForm } from './components/AddExpenseForm'
import { ExpenseList } from './components/ExpenseList'
import { RunningTotal } from './components/RunningTotal'
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

  async function handleDelete(id: string) {
    try {
      await removeExpense(id)
      setExpenses(await getAllExpenses())
      setError('')
    } catch {
      setError('Failed to delete expense.')
    }
  }

  return (
    <main className="app">
      <header className="app__header">
        <h1>Expense Tracker</h1>
        <RunningTotal expenses={expenses} />
      </header>
      <AddExpenseForm onAdd={handleAdd} />
      {error && (
        <p className="app__error" role="alert">
          {error}
        </p>
      )}
      {loading ? (
        <p className="loading">Loading…</p>
      ) : (
        <ExpenseList expenses={expenses} onDelete={handleDelete} />
      )}
    </main>
  )
}

export default App
