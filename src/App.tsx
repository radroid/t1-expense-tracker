import { useState } from 'react'
import { type Expense, type ExpenseInput } from './lib/expense'
import { ExpenseForm } from './components/ExpenseForm'
import { ExpenseList } from './components/ExpenseList'
import { RunningTotal } from './components/RunningTotal'
import { SpendingByCategory } from './components/SpendingByCategory'
import { SpendingChart } from './components/SpendingChart'
import { CategoryManager } from './components/CategoryManager'
import { CategoryFilter } from './components/CategoryFilter'
import { MonthSwitcher } from './components/MonthSwitcher'
import { MonthlySummary } from './components/MonthlySummary'
import { BudgetForm } from './components/BudgetForm'
import { BudgetVsActual } from './components/BudgetVsActual'
import { SearchBox } from './components/SearchBox'
import { DateRangeFilter } from './components/DateRangeFilter'
import { ThemeToggle } from './components/ThemeToggle'
import { type CategoryFilterValue } from './lib/expenseFilter'
import { currentMonth } from './lib/month'
import { totalAmount } from './lib/totals'
import { computeBudgetStatus } from './lib/budgetStatus'
import { useExpenses } from './hooks/useExpenses'
import { useCategories } from './hooks/useCategories'
import { useMonthlyBudgets } from './hooks/useMonthlyBudgets'
import { useVisibleExpenses } from './hooks/useVisibleExpenses'
import './App.css'

function App() {
  const expensesHook = useExpenses()
  const categoriesHook = useCategories()
  const budgetsHook = useMonthlyBudgets()
  const [editing, setEditing] = useState<Expense | null>(null)
  const [filter, setFilter] = useState<CategoryFilterValue>('all')
  // Lazy initializer: useState calls `currentMonth` once on mount, so
  // selectedMonth is a 'YYYY-MM' string — not a function reference.
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonth)
  const [searchTerm, setSearchTerm] = useState('')
  const [dateRange, setDateRange] = useState<{ from: string; to: string } | null>(
    null,
  )

  // Filter pipeline lives in useVisibleExpenses. New view-state (P4.A search,
  // P4.B date-range) will plug into that hook's signature rather than scattering
  // through App. monthlyExpenses is the month-only slice (used by BudgetVsActual
  // — budget is month-scoped regardless of category filter); visibleExpenses is
  // the user-visible slice flowing to everything else.
  const { monthlyExpenses, visibleExpenses } = useVisibleExpenses({
    expenses: expensesHook.expenses,
    selectedMonth,
    categoryFilter: filter,
    categories: categoriesHook.categories,
    searchTerm,
    dateRange,
  })
  // Budget vs actual is scoped to the month, NOT the category filter — the
  // budget covers all spending for the month, regardless of which categories
  // the user is currently filtering by in the list.
  const budgetStatus = computeBudgetStatus(
    budgetsHook.getFor(selectedMonth)?.amount,
    totalAmount(monthlyExpenses),
  )
  const loading =
    expensesHook.loading || categoriesHook.loading || budgetsHook.loading
  // Each hook owns its own error string; we surface whichever is non-empty
  // (expense first). Note this is a small UX shift from the pre-hooks code,
  // where a single shared error slot was cleared by ANY successful op — now
  // an expense success only clears the expense error, leaving any outstanding
  // category error visible (and vice versa). Errors are domain-scoped.
  const error =
    expensesHook.error || categoriesHook.error || budgetsHook.error

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
        <ThemeToggle />
        <RunningTotal expenses={visibleExpenses} />
        <MonthSwitcher value={selectedMonth} onChange={setSelectedMonth} />
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
          <SearchBox value={searchTerm} onChange={setSearchTerm} />
          <DateRangeFilter value={dateRange} onChange={setDateRange} />
          <ExpenseList
            expenses={visibleExpenses}
            categories={categoriesHook.categories}
            onDelete={expensesHook.remove}
            onEdit={setEditing}
          />
        </>
      )}
      <section className="app__insights">
        <h2>Budget vs actual</h2>
        <BudgetVsActual status={budgetStatus} />
        <h2>Monthly summary</h2>
        <MonthlySummary expenses={visibleExpenses} />
        <h2>Spending by category</h2>
        <SpendingByCategory
          expenses={visibleExpenses}
          categories={categoriesHook.categories}
        />
        <SpendingChart
          expenses={visibleExpenses}
          categories={categoriesHook.categories}
        />
      </section>
      <section className="app__budget">
        <h2>Monthly budget</h2>
        <BudgetForm
          key={selectedMonth}
          month={selectedMonth}
          currentAmount={budgetsHook.getFor(selectedMonth)?.amount}
          onSubmit={budgetsHook.set}
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
