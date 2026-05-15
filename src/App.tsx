import { useEffect, useState } from 'react'
import {
  applyExpenseEdit,
  createExpense,
  type Expense,
  type ExpenseInput,
} from './lib/expense'
import {
  createCategory,
  type Category,
  type CategoryInput,
} from './lib/category'
import {
  addExpense,
  getAllExpenses,
  removeExpense,
  updateExpense,
} from './db/expenseStore'
import {
  addCategory,
  getAllCategories,
  removeCategory,
  seedDefaultCategories,
  updateCategory,
} from './db/categoryStore'
import { ExpenseForm } from './components/ExpenseForm'
import { ExpenseList } from './components/ExpenseList'
import { RunningTotal } from './components/RunningTotal'
import { SpendingByCategory } from './components/SpendingByCategory'
import { CategoryManager } from './components/CategoryManager'
import { CategoryFilter } from './components/CategoryFilter'
import {
  filterExpensesByCategory,
  type CategoryFilterValue,
} from './lib/expenseFilter'
import './App.css'

function App() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [editing, setEditing] = useState<Expense | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState<CategoryFilterValue>('all')

  const visibleExpenses = filterExpensesByCategory(expenses, filter, categories)

  useEffect(() => {
    Promise.all([getAllExpenses(), seedDefaultCategories()])
      .then(([loadedExpenses, loadedCategories]) => {
        setExpenses(loadedExpenses)
        setCategories(loadedCategories)
      })
      .catch(() => setError('Failed to load data.'))
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

  async function handleAddCategory(input: CategoryInput) {
    let category: Category
    try {
      category = createCategory(input)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Invalid category.')
      return
    }
    try {
      await addCategory(category)
      setCategories(await getAllCategories())
      setError('')
    } catch {
      setError('Failed to add category.')
    }
  }

  async function handleRenameCategory(id: string, name: string) {
    const existing = categories.find((c) => c.id === id)
    if (!existing) {
      setError('Category not found.')
      return
    }
    try {
      await updateCategory({ ...existing, name })
      setCategories(await getAllCategories())
      setError('')
    } catch {
      setError('Failed to rename category.')
    }
  }

  async function handleDeleteCategory(id: string) {
    try {
      await removeCategory(id)
      setCategories(await getAllCategories())
      // Deleting the category currently being filtered on would leave the
      // <select> orphaned (no matching <option>) and silently produce an empty
      // list + $0 totals. Snap back to 'all'.
      if (filter === id) setFilter('all')
      setError('')
    } catch {
      setError('Failed to delete category.')
    }
  }

  return (
    <main className="app">
      <header className="app__header">
        <h1>Expense Tracker</h1>
        <RunningTotal expenses={visibleExpenses} />
      </header>
      {editing ? (
        <ExpenseForm
          key={editing.id}
          initial={{
            amount: editing.amount,
            description: editing.description,
            date: editing.date,
            categoryId: editing.categoryId,
          }}
          categories={categories}
          submitLabel="Save"
          onSubmit={handleUpdate}
          onCancel={() => setEditing(null)}
        />
      ) : (
        <ExpenseForm
          key="new"
          categories={categories}
          submitLabel="Add expense"
          onSubmit={handleAdd}
          clearOnSubmit
        />
      )}
      {error && (
        <p className="app__error" role="alert">
          {error}
        </p>
      )}
      {loading ? (
        <p className="loading">Loading…</p>
      ) : (
        <>
          <CategoryFilter
            value={filter}
            categories={categories}
            onChange={setFilter}
          />
          <ExpenseList
            expenses={visibleExpenses}
            categories={categories}
            onDelete={handleDelete}
            onEdit={setEditing}
          />
        </>
      )}
      <section className="app__insights">
        <h2>Spending by category</h2>
        <SpendingByCategory
          expenses={visibleExpenses}
          categories={categories}
        />
      </section>
      <section className="app__categories">
        <h2>Categories</h2>
        <CategoryManager
          categories={categories}
          onAdd={handleAddCategory}
          onRename={handleRenameCategory}
          onDelete={handleDeleteCategory}
        />
      </section>
    </main>
  )
}

export default App
