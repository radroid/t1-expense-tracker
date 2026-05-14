import { useEffect, useState } from 'react'
import {
  applyExpenseEdit,
  createExpense,
  type Expense,
  type ExpenseInput,
} from './lib/expense'
import {
  addExpense,
  getAllExpenses,
  removeExpense,
  updateExpense,
} from './db/expenseStore'
import { AddExpenseForm } from './components/AddExpenseForm'
import { EditExpenseForm } from './components/EditExpenseForm'
import { ExpenseList } from './components/ExpenseList'
import { RunningTotal } from './components/RunningTotal'
import './App.css'

function App() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [editing, setEditing] = useState<Expense | null>(null)
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

  async function handleUpdate(input: ExpenseInput) {
    if (!editing) return
    let updated: Expense
    try {
      updated = applyExpenseEdit(editing, input)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Invalid expense.')
      return
    }
    try {
      await updateExpense(updated)
      setExpenses(await getAllExpenses())
      setError('')
      setEditing(null)
    } catch {
      setError('Failed to save changes.')
    }
  }

  return (
    <main className="app">
      <header className="app__header">
        <h1>Expense Tracker</h1>
        <RunningTotal expenses={expenses} />
      </header>
      {editing ? (
        <EditExpenseForm
          expense={editing}
          onSave={handleUpdate}
          onCancel={() => setEditing(null)}
        />
      ) : (
        <AddExpenseForm onAdd={handleAdd} />
      )}
      {error && (
        <p className="app__error" role="alert">
          {error}
        </p>
      )}
      {loading ? (
        <p className="loading">Loading…</p>
      ) : (
        <ExpenseList
          expenses={expenses}
          onDelete={handleDelete}
          onEdit={setEditing}
        />
      )}
    </main>
  )
}

export default App
