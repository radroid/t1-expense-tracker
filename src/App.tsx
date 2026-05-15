import { useState } from 'react'
import { type Expense, type ExpenseInput } from './lib/expense'
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
import { useExpenses } from './hooks/useExpenses'
import { useCategories } from './hooks/useCategories'
import './App.css'

function App() {
  const expensesHook = useExpenses()
  const categoriesHook = useCategories()
  const [editing, setEditing] = useState<Expense | null>(null)
  const [filter, setFilter] = useState<CategoryFilterValue>('all')

  const visibleExpenses = filterExpensesByCategory(
    expensesHook.expenses,
    filter,
    categoriesHook.categories,
  )
  const loading = expensesHook.loading || categoriesHook.loading
  const error = expensesHook.error || categoriesHook.error

  async function handleUpdate(input: ExpenseInput) {
    if (!editing) return
    const ok = await expensesHook.update(editing, input)
    if (ok) setEditing(null)
  }

  async function handleDeleteCategory(id: string) {
    const ok = await categoriesHook.remove(id)
    // The filter pointing at a now-deleted category would orphan the <select>
    // and silently produce an empty list + $0 totals. Snap back to 'all'.
    if (ok && filter === id) setFilter('all')
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
          categories={categoriesHook.categories}
          submitLabel="Save"
          onSubmit={handleUpdate}
          onCancel={() => setEditing(null)}
        />
      ) : (
        <ExpenseForm
          key="new"
          categories={categoriesHook.categories}
          submitLabel="Add expense"
          onSubmit={expensesHook.add}
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
            categories={categoriesHook.categories}
            onChange={setFilter}
          />
          <ExpenseList
            expenses={visibleExpenses}
            categories={categoriesHook.categories}
            onDelete={expensesHook.remove}
            onEdit={setEditing}
          />
        </>
      )}
      <section className="app__insights">
        <h2>Spending by category</h2>
        <SpendingByCategory
          expenses={visibleExpenses}
          categories={categoriesHook.categories}
        />
      </section>
      <section className="app__categories">
        <h2>Categories</h2>
        <CategoryManager
          categories={categoriesHook.categories}
          onAdd={categoriesHook.add}
          onRename={categoriesHook.rename}
          onDelete={handleDeleteCategory}
        />
      </section>
    </main>
  )
}

export default App
