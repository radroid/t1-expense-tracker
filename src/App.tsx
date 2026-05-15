import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import { type Expense, type ExpenseInput } from './lib/expense'
import {
  dueTemplatesForMonth,
  generateDueExpenses,
  type RecurringTemplate,
  type RecurringTemplateInput,
} from './lib/recurring'
import { ExpenseForm } from './components/ExpenseForm'
import { ExpenseList } from './components/ExpenseList'
import { RunningTotal } from './components/RunningTotal'
import { SpendingByCategory } from './components/SpendingByCategory'
import { SpendingChart } from './components/SpendingChart'
import { CategoryBudgetManager } from './components/CategoryBudgetManager'
// P6.D — three rare-use management surfaces are code-split. They live below
// the fold (Categories / Recurring / BackupRestore), are unlikely to be the
// user's first interaction, and pull in their own UI + helpers. lazy()
// gives Vite a dynamic-import boundary so each becomes its own chunk.
const CategoryManager = lazy(() =>
  import('./components/CategoryManager').then((m) => ({ default: m.CategoryManager })),
)
const RecurringManager = lazy(() =>
  import('./components/RecurringManager').then((m) => ({ default: m.RecurringManager })),
)
import { CategoryFilter } from './components/CategoryFilter'
import { MonthSwitcher } from './components/MonthSwitcher'
import { YearSwitcher } from './components/YearSwitcher'
import { TrendsChart } from './components/TrendsChart'
import { MonthlySummary } from './components/MonthlySummary'
import { BudgetForm } from './components/BudgetForm'
import { BudgetVsActual } from './components/BudgetVsActual'
import { SearchBox } from './components/SearchBox'
import { DateRangeFilter } from './components/DateRangeFilter'
import { ThemeToggle } from './components/ThemeToggle'
import { CurrencySelector } from './components/CurrencySelector'
import { ExportButton } from './components/ExportButton'
import { ImportButton } from './components/ImportButton'
import { BackupExport } from './components/BackupExport'
// P6.D — BackupRestore pulls in parseBackup + restoreBackup + a native
// <dialog> flow; rare-use surface, code-split for the same reason as
// CategoryManager and RecurringManager.
const BackupRestore = lazy(() =>
  import('./components/BackupRestore').then((m) => ({ default: m.BackupRestore })),
)
import { Spinner } from './components/Spinner'
import { UndoToast } from './components/UndoToast'
import { type CategoryFilterValue } from './lib/expenseFilter'
import { categoryBudgetId } from './lib/categoryBudget'
import { currentMonth } from './lib/month'
import { currentYear } from './lib/year'
import { summarizeYear } from './lib/trends'
import {
  parseFilters,
  serializeFilters,
  type FilterState,
} from './lib/urlFilters'
import { totalAmount } from './lib/totals'
import { computeBudgetStatus } from './lib/budgetStatus'
import { categoryMessages } from './lib/errorMessages'
import { useExpenses } from './hooks/useExpenses'
import { useCategories } from './hooks/useCategories'
import { useMonthlyBudgets } from './hooks/useMonthlyBudgets'
import { useCategoryBudgets } from './hooks/useCategoryBudgets'
import { useRecurringTemplates } from './hooks/useRecurringTemplates'
import { useVisibleExpenses } from './hooks/useVisibleExpenses'
import { useCurrency } from './hooks/useCurrency'
import { useUndoStack } from './hooks/useUndoStack'
import './App.css'

function App() {
  const expensesHook = useExpenses()
  const categoriesHook = useCategories()
  const budgetsHook = useMonthlyBudgets()
  const categoryBudgetsHook = useCategoryBudgets()
  const recurringHook = useRecurringTemplates()
  const { currency, setCurrency } = useCurrency()
  // P7.B — single-step undo. The hook holds at most one pending action;
  // each in-scope mutation handler below (delete/edit/rename/set) pushes
  // an inverse action on success. The toast renders the affordance.
  const undoStack = useUndoStack()
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
  // P6.B — selectedYear for the Trends section. Independent of selectedMonth;
  // the Trends section is always rendered and reads from the full expenses
  // list (NOT visibleExpenses) so user filters in the month view don't
  // collapse the year-over-year picture.
  const [selectedYear, setSelectedYear] = useState<string>(currentYear)

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
  const yearTrendsData = useMemo(
    () => summarizeYear(expensesHook.expenses, selectedYear),
    [expensesHook.expenses, selectedYear],
  )

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
  // Each hook owns its own error string. Pre-iter-032, only the first
  // non-empty error was shown (priority-cascade); this dropped real
  // information when two stores failed at once. a11y-P1 TD.23 changes
  // this to a join across all currently-set errors so SR + sighted users
  // see every outstanding failure. Filter on `e !== ''` (the canonical
  // "no error" sentinel each hook uses) rather than truthiness so a
  // hypothetical falsy-but-non-empty value still surfaces.
  const errors = [
    expensesHook.error,
    categoriesHook.error,
    budgetsHook.error,
    categoryBudgetsHook.error,
    recurringHook.error,
  ].filter((e): e is string => e !== '')

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
    // Snapshot the pre-edit entity so the undo inverse can replay it.
    const before = editing
    const ok = await expensesHook.update(editing, input)
    if (ok) {
      setEditing(null)
      undoStack.push({
        label: `Edited “${before.description}”`,
        inverse: async () => {
          // Reapply the pre-edit input shape against the current entity
          // (same id — update preserves it), restoring all editable fields.
          await expensesHook.update(before, {
            amount: before.amount,
            description: before.description,
            date: before.date,
            categoryId: before.categoryId,
          })
        },
      })
    }
  }

  // Wrap expense delete to capture the pre-delete entity for the undo
  // inverse. On success we push an "Undo" that re-adds the same input
  // shape; note this mints a fresh UUID — the user sees the row come
  // back, just under a new id. Acceptable for v1; restoring with the
  // original id would require a `restore(entity)` extension to the hook,
  // which is OUT of this iter's allowlist.
  async function handleExpenseDelete(id: string): Promise<boolean> {
    const before = expensesHook.expenses.find((e) => e.id === id)
    const ok = await expensesHook.remove(id)
    if (ok && before) {
      undoStack.push({
        label: `Deleted “${before.description}”`,
        inverse: async () => {
          await expensesHook.add({
            amount: before.amount,
            description: before.description,
            date: before.date,
            categoryId: before.categoryId,
            sourceTemplateId: before.sourceTemplateId,
          })
        },
      })
    }
    return ok
  }

  async function handleDeleteCategory(id: string) {
    const inUseCount = expensesHook.expenses.filter(
      (e) => e.categoryId === id,
    ).length
    if (inUseCount > 0) {
      categoriesHook.setError(categoryMessages.inUse(inUseCount))
      return
    }
    const before = categoriesHook.categories.find((c) => c.id === id)
    const ok = await categoriesHook.remove(id)
    // The filter pointing at a now-deleted category would orphan the <select>
    // and silently produce an empty list + $0 totals. Snap back to 'all'.
    if (ok && filter === id) setFilter('all')
    if (ok && before) {
      undoStack.push({
        label: `Deleted category “${before.name}”`,
        inverse: async () => {
          // Re-add via the input shape — id will be regenerated. Acceptable
          // since category id is referenced from Expense.categoryId, but
          // the deleted category had no in-use expenses by the guard above,
          // so no dangling references survive.
          await categoriesHook.add({ name: before.name, color: before.color })
        },
      })
    }
  }

  // Category rename — the inverse just renames back.
  async function handleCategoryRename(
    id: string,
    name: string,
  ): Promise<boolean> {
    const before = categoriesHook.categories.find((c) => c.id === id)
    const ok = await categoriesHook.rename(id, name)
    if (ok && before && before.name !== name) {
      undoStack.push({
        label: `Renamed “${before.name}” → “${name}”`,
        inverse: async () => {
          await categoriesHook.rename(id, before.name)
        },
      })
    }
    return ok
  }

  // Monthly budget set/upsert — snapshot the prior amount; the inverse
  // either re-sets the prior amount or removes the row when there was
  // no prior budget. useMonthlyBudgets exposes `remove(month)`, so the
  // "unset" edge is handled cleanly without a sentinel zero.
  async function handleSetBudget(
    month: string,
    amount: number,
  ): Promise<boolean> {
    const beforeAmount = budgetsHook.getFor(month)?.amount
    const ok = await budgetsHook.set(month, amount)
    if (ok) {
      undoStack.push({
        label:
          beforeAmount === undefined
            ? `Set budget for ${month}`
            : `Changed budget for ${month}`,
        inverse: async () => {
          if (beforeAmount === undefined) {
            await budgetsHook.remove(month)
          } else {
            await budgetsHook.set(month, beforeAmount)
          }
        },
      })
    }
    return ok
  }

  // Per-category budget set — same shape as the monthly budget. The
  // inverse either re-sets the prior amount or removes the row.
  async function handleSetCategoryBudget(
    month: string,
    categoryId: string,
    amount: number,
  ): Promise<boolean> {
    const beforeAmount = categoryBudgetsHook.getFor(month, categoryId)?.amount
    const ok = await categoryBudgetsHook.set(month, categoryId, amount)
    if (ok) {
      undoStack.push({
        label:
          beforeAmount === undefined
            ? 'Set category budget'
            : 'Changed category budget',
        inverse: async () => {
          if (beforeAmount === undefined) {
            await categoryBudgetsHook.remove(
              categoryBudgetId(month, categoryId),
            )
          } else {
            await categoryBudgetsHook.set(month, categoryId, beforeAmount)
          }
        },
      })
    }
    return ok
  }

  // Recurring template delete — inverse re-adds via the input shape (fresh id).
  async function handleRecurringDelete(id: string): Promise<boolean> {
    const before = recurringHook.templates.find((t) => t.id === id)
    const ok = await recurringHook.remove(id)
    if (ok && before) {
      undoStack.push({
        label: `Deleted recurring “${before.description}”`,
        inverse: async () => {
          await recurringHook.add({
            description: before.description,
            amount: before.amount,
            frequency: before.frequency,
            dayOfMonth: before.dayOfMonth,
            categoryId: before.categoryId,
          })
        },
      })
    }
    return ok
  }

  // Recurring template update — inverse reapplies the prior input shape.
  async function handleRecurringUpdate(
    existing: RecurringTemplate,
    input: RecurringTemplateInput,
  ): Promise<boolean> {
    const before = existing
    const ok = await recurringHook.update(existing, input)
    if (ok) {
      undoStack.push({
        label: `Edited recurring “${before.description}”`,
        inverse: async () => {
          await recurringHook.update(before, {
            description: before.description,
            amount: before.amount,
            frequency: before.frequency,
            dayOfMonth: before.dayOfMonth,
            categoryId: before.categoryId,
          })
        },
      })
    }
    return ok
  }

  return (
    <main className="app">
      {/* a11y-P1 TD.19: skip-link is the first focusable element so a
          keyboard user lands on it on Tab. Visible only on :focus via
          a CSS transform; positioned absolutely so it doesn't shift
          layout when hidden. Targets #main-content below. */}
      <a href="#main-content" className="skip-link">
        Skip to expense list
      </a>
      <header className="app__header">
        <h1>Expense Tracker</h1>
        <ThemeToggle />
        <CurrencySelector value={currency} onChange={setCurrency} />
        <RunningTotal expenses={visibleExpenses} currency={currency} />
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
      {/* a11y-P1 TD.20 + TD.23: persistent error live-region — always in
          the DOM (empty when there are no errors) so assistive tech can
          observe insertions without losing the region reference. The
          slot uses `aria-live="assertive"` since these are domain
          errors. TD.23: all currently-set hook errors are joined with
          " · " rather than priority-cascaded — a second simultaneous
          failure is now visible alongside the first. */}
      <div
        className="app__error"
        role="alert"
        aria-live="assertive"
        aria-atomic="true"
      >
        {errors.length > 0 ? errors.join(' · ') : ''}
      </div>
      {/* P7.B — single-step undo snackbar. Renders nothing until a
          reversible mutation pushes an action; auto-dismisses after 6s. */}
      <UndoToast
        action={undoStack.pending}
        onUndo={undoStack.undo}
        onDismiss={undoStack.dismiss}
      />
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
            <Suspense fallback={<Spinner size="sm" />}>
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
            </Suspense>
          </div>
          {/* a11y-P1 TD.19 target: skip-link above jumps here. Wrapping
              the expense list in a labelled section gives the link a
              concrete anchor and gives SR users a landmark for "the
              expense list". */}
          <section
            id="main-content"
            className="app__main"
            aria-label="Expense list"
          >
            <ExpenseList
              expenses={visibleExpenses}
              categories={categoriesHook.categories}
              currency={currency}
              onDelete={handleExpenseDelete}
              onEdit={setEditing}
            />
          </section>
          {/* P6.C a11y-012: insights/trends/budget/categories/recurring all
              depend on data the hooks are still loading. Rendering them
              with empty/zero state during mount flashes "$0", "No budget",
              and "No expenses" cards before the real values land. Gate
              them on `!loading` so the loading spinner above is the only
              thing visible until data resolves. Also wires up the a11y-003
              section landmarks (aria-labelledby/aria-label). */}
          <section className="app__insights" aria-label="Insights">
            <h2>Budget vs actual</h2>
            <BudgetVsActual status={budgetStatus} currency={currency} />
            <h2>Monthly summary</h2>
            <MonthlySummary expenses={visibleExpenses} currency={currency} />
            <h2>Spending by category</h2>
            <SpendingByCategory
              expenses={visibleExpenses}
              categories={categoriesHook.categories}
              currency={currency}
            />
            <SpendingChart
              expenses={visibleExpenses}
              categories={categoriesHook.categories}
              currency={currency}
            />
          </section>
          <section
            className="app__trends"
            aria-labelledby="heading-trends"
          >
            <h2 id="heading-trends">Trends</h2>
            <YearSwitcher value={selectedYear} onChange={setSelectedYear} />
            <TrendsChart
              data={yearTrendsData}
              currency={currency}
              yearLabel={selectedYear}
            />
          </section>
          <section
            className="app__budget"
            aria-labelledby="heading-budget"
          >
            <h2 id="heading-budget">Monthly budget</h2>
            <BudgetForm
              key={selectedMonth}
              month={selectedMonth}
              currentAmount={budgetsHook.getFor(selectedMonth)?.amount}
              onSubmit={handleSetBudget}
            />
          </section>
          <section
            className="app__category-budgets"
            aria-labelledby="heading-category-budgets"
          >
            <h2 id="heading-category-budgets">Per-category budgets</h2>
            <CategoryBudgetManager
              month={selectedMonth}
              categories={categoriesHook.categories}
              categoryBudgets={categoryBudgetsHook.categoryBudgets}
              onSet={handleSetCategoryBudget}
              onRemove={categoryBudgetsHook.remove}
            />
          </section>
          <section
            className="app__categories"
            aria-labelledby="heading-categories"
          >
            <h2 id="heading-categories">Categories</h2>
            <Suspense fallback={<Spinner size="sm" />}>
              <CategoryManager
                categories={categoriesHook.categories}
                onAdd={categoriesHook.add}
                onRename={handleCategoryRename}
                onDelete={handleDeleteCategory}
                getInUseCount={(id) =>
                  expensesHook.expenses.filter((e) => e.categoryId === id).length
                }
              />
            </Suspense>
          </section>
          <section
            className="app__recurring"
            aria-labelledby="heading-recurring"
          >
            <h2 id="heading-recurring">Recurring expenses</h2>
            <Suspense fallback={<Spinner size="sm" />}>
              <RecurringManager
                templates={recurringHook.templates}
                categories={categoriesHook.categories}
                onAdd={recurringHook.add}
                onAddMany={recurringHook.addMany}
                onUpdate={handleRecurringUpdate}
                onDelete={handleRecurringDelete}
              />
            </Suspense>
          </section>
        </>
      )}
    </main>
  )
}

export default App
