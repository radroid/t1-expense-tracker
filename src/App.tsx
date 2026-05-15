import { useEffect, useState } from 'react'
import { type Expense, type ExpenseInput } from './lib/expense'
import { dueTemplatesForMonth, generateDueExpenses } from './lib/recurring'
import { ExpenseForm } from './components/ExpenseForm'
import { ExpenseList } from './components/ExpenseList'
import { RunningTotal } from './components/RunningTotal'
import { SpendingByCategory } from './components/SpendingByCategory'
import { SpendingChart } from './components/SpendingChart'
import { CategoryManager } from './components/CategoryManager'
import { CategoryBudgetManager } from './components/CategoryBudgetManager'
import { RecurringManager } from './components/RecurringManager'
import { CategoryFilter } from './components/CategoryFilter'
import { MonthSwitcher } from './components/MonthSwitcher'
import { MonthlySummary } from './components/MonthlySummary'
import { BudgetForm } from './components/BudgetForm'
import { BudgetVsActual } from './components/BudgetVsActual'
import { SearchBox } from './components/SearchBox'
import { DateRangeFilter } from './components/DateRangeFilter'
import { ThemeToggle } from './components/ThemeToggle'
import { ExportButton } from './components/ExportButton'
import { ImportButton } from './components/ImportButton'
import { BackupExport } from './components/BackupExport'
import { BackupRestore } from './components/BackupRestore'
import { Spinner } from './components/Spinner'
import { type CategoryFilterValue } from './lib/expenseFilter'
import { currentMonth } from './lib/month'
import {
  parseFilters,
  serializeFilters,
  type FilterState,
} from './lib/urlFilters'
import { totalAmount } from './lib/totals'
import { computeBudgetStatus } from './lib/budgetStatus'
import { useExpenses } from './hooks/useExpenses'
import { useCategories } from './hooks/useCategories'
import { useMonthlyBudgets } from './hooks/useMonthlyBudgets'
import { useCategoryBudgets } from './hooks/useCategoryBudgets'
import { useRecurringTemplates } from './hooks/useRecurringTemplates'
import { useVisibleExpenses } from './hooks/useVisibleExpenses'
import './App.css'

function App() {
  const expensesHook = useExpenses()
  const categoriesHook = useCategories()
  const budgetsHook = useMonthlyBudgets()
  const categoryBudgetsHook = useCategoryBudgets()
  const recurringHook = useRecurringTemplates()
  const [editing, setEditing] = useState<Expense | null>(null)
  // Lazy-init filter state from the URL hash so a bookmarked / reloaded
  // filtered view restores on first paint. parseFilters returns only the
  // fields present in the hash; missing fields fall back to defaults.
  // Reading window.location.hash inside the initializer runs once.
  const initialFilters: Partial<FilterState> = parseFilters(
    typeof window === 'undefined'
      ? ''
      : window.location.hash.replace(/^#/, ''),
  )
  const [filter, setFilter] = useState<CategoryFilterValue>(
    (initialFilters.filter as CategoryFilterValue | undefined) ?? 'all',
  )
  const [selectedMonth, setSelectedMonth] = useState<string>(
    initialFilters.selectedMonth ?? currentMonth(),
  )
  const [searchTerm, setSearchTerm] = useState(initialFilters.searchTerm ?? '')
  const [dateRange, setDateRange] = useState<{ from: string; to: string } | null>(
    initialFilters.dateRange ?? null,
  )

  // P5.A — keep the URL hash in sync with current filter state. Effect
  // runs on every filter change; no DOM access in the lib, so we own
  // window.location here.
  useEffect(() => {
    const hash = serializeFilters({
      selectedMonth,
      filter,
      searchTerm,
      dateRange,
    })
    const next = hash === '' ? '' : `#${hash}`
    if (typeof window !== 'undefined' && window.location.hash !== next) {
      // replaceState avoids polluting the back stack on every keystroke.
      // When clearing, target the current path + search so the URL retains
      // its base — passing a single space (as an earlier revision did) is
      // unconventional and would leave a literal " " in the URL bar.
      const targetUrl =
        next === ''
          ? `${window.location.pathname}${window.location.search}`
          : next
      window.history.replaceState(null, '', targetUrl)
    }
  }, [selectedMonth, filter, searchTerm, dateRange])

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
    expensesHook.loading ||
    categoriesHook.loading ||
    budgetsHook.loading ||
    categoryBudgetsHook.loading ||
    recurringHook.loading
  // Each hook owns its own error string; we surface whichever is non-empty
  // (expense first). Note this is a small UX shift from the pre-hooks code,
  // where a single shared error slot was cleared by ANY successful op — now
  // an expense success only clears the expense error, leaving any outstanding
  // category error visible (and vice versa). Errors are domain-scoped.
  const error =
    expensesHook.error ||
    categoriesHook.error ||
    budgetsHook.error ||
    categoryBudgetsHook.error ||
    recurringHook.error

  // P4.E: rollover recurring templates into actual expenses for the selected
  // month. Triggers on mount AND any month switch. Idempotency comes from
  // dueTemplatesForMonth — any template whose generated expense is already in
  // `expenses` is skipped. Note the dep on `expensesHook.expenses`: after
  // addMany resolves, the new expenses flow back in and flip the next
  // recomputation to an empty due-list, so the effect no-ops and doesn't loop.
  useEffect(() => {
    if (recurringHook.loading || expensesHook.loading) return
    const due = dueTemplatesForMonth(
      recurringHook.templates,
      expensesHook.expenses,
      selectedMonth,
    )
    if (due.length === 0) return
    const inputs = generateDueExpenses(due, selectedMonth)
    void expensesHook.addMany(inputs)
    // expensesHook.addMany is a stable method reference from a hook; including
    // it in deps would be noise. Same for expensesHook itself.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    recurringHook.loading,
    recurringHook.templates,
    expensesHook.loading,
    expensesHook.expenses,
    selectedMonth,
  ])

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
        <Spinner size="lg" />
      ) : (
        <>
          <CategoryFilter
            value={filter}
            categories={categoriesHook.categories}
            onChange={setFilter}
          />
          <SearchBox value={searchTerm} onChange={setSearchTerm} />
          <DateRangeFilter value={dateRange} onChange={setDateRange} />
          <div className="app__csv">
            <ExportButton expenses={visibleExpenses} />
            <ImportButton onImport={expensesHook.addMany} />
            <BackupExport
              expenses={expensesHook.expenses}
              categories={categoriesHook.categories}
              monthlyBudgets={budgetsHook.budgets}
              recurringTemplates={recurringHook.templates}
              categoryBudgets={categoryBudgetsHook.categoryBudgets}
            />
            <BackupRestore
              onRestore={async () => {
                // After the multi-store IDB write commits, pull every
                // hook back into sync. Parallel because each refresh is
                // an independent store read. allSettled so a refresh
                // failure (which is just a UI-sync miss, not a data
                // loss) doesn't make BackupRestore show "Restore
                // failed" — the DB write already committed.
                await Promise.allSettled([
                  expensesHook.refresh(),
                  categoriesHook.refresh(),
                  budgetsHook.refresh(),
                  recurringHook.refresh(),
                  categoryBudgetsHook.refresh(),
                ])
                return true
              }}
            />
          </div>
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
      <section className="app__category-budgets">
        <h2>Per-category budgets</h2>
        <CategoryBudgetManager
          month={selectedMonth}
          categories={categoriesHook.categories}
          categoryBudgets={categoryBudgetsHook.categoryBudgets}
          onSet={categoryBudgetsHook.set}
          onRemove={categoryBudgetsHook.remove}
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
      <section className="app__recurring">
        <h2>Recurring expenses</h2>
        <RecurringManager
          templates={recurringHook.templates}
          categories={categoriesHook.categories}
          onAdd={recurringHook.add}
          onDelete={recurringHook.remove}
        />
      </section>
    </main>
  )
}

export default App
