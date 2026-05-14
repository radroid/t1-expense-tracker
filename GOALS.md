# GOALS.md

Backlog for the autonomous build loop. Phases run top-to-bottom. Item ids are `P<phase>.<letter>`.
Markers: `[ ]` open · `[wip]` in progress · `[done]` shipped (— see iter-NNN / PR #N) · `[blocked]`.

A feature is a **vertical slice** — it normally touches `src/db/`, `src/lib/`, and
`src/components/` plus tests. Each ships as its own PR (`pr_mode: true`).

## Phase 1 — Core expense CRUD + persistence

- [done] P1.A — Expense data model — `Expense` type + `createExpense` factory with validation (amount > 0, non-empty description, valid date). — iter-001 / PR #1
- [done] P1.B — IndexedDB expense store — `src/db/` wrapper: open DB, `add` / `getAll` / `update` / `remove` on an `expenses` object store keyed by id. — iter-001 / PR #2
- [done] P1.C — Add-expense form — Controlled form (amount, description, date); persists via the store and clears on submit. — iter-001 / PR #3
- [done] P1.D — Expense list — Render all expenses newest-first (amount, description, date). — iter-001 / PR #4
- [done] P1.E — Delete expense — Per-row delete; removes from store + list. — iter-002 / PR #6
- [done] P1.F — Edit expense — Edit an existing expense (inline or modal); persists changes. — iter-003 / PR #9
- [done] P1.G — Running total — Sum of all expenses shown in the header. — iter-002 / PR #7

## Phase 2 — Categories

- [done] P2.A — Category model + store — `Category` type (id, name, color) + IndexedDB store; seed a few defaults on first run. — iter-004 / PR #11
- [done] P2.B — Category management UI — Add / rename / delete categories. — iter-004 / PR #12
- [ ] P2.C — Assign category to expense — Category picker in the add/edit form.
- [ ] P2.D — Filter by category — Filter control above the expense list.
- [ ] P2.E — Category badges — Colored category badge on each expense row.
- [ ] P2.F — Spending by category — Totals grouped by category.

## Phase 3 — Budgets & insights

- [ ] P3.A — Monthly budget model — Per-month budget amount, persisted (`MonthlyBudget`).
- [ ] P3.B — Budget vs actual — This month's spend against budget with a progress bar.
- [ ] P3.C — Month switcher — Navigate between months; list + totals scope to the selected month.
- [ ] P3.D — Spending chart — Simple bar chart of spend per category for the selected month.
- [ ] P3.E — Monthly summary — Total / average / count for the selected month.
- [ ] P3.F — Over-budget warning — Visual warning when spend exceeds the month's budget.

## Phase 4 — Polish & power features

- [ ] P4.A — Search — Text search across expense descriptions.
- [ ] P4.B — Date-range filter — From/to date filter on the list.
- [ ] P4.C — CSV export — Export the currently-filtered expenses to a CSV download.
- [ ] P4.D — CSV import — Import expenses from a CSV file (with validation + error report).
- [ ] P4.E — Recurring expenses — Mark an expense recurring; auto-generate it on month rollover.
- [ ] P4.F — Dark mode — Theme toggle, persisted to localStorage.
- [ ] P4.G — Empty + loading states — Polished empty and loading states across surfaces.
- [ ] P4.H — Responsive layout — Mobile-friendly layout down to 480px.

## Tech debt

- [ ] TD.1 — Extract a shared `formatCurrency` helper into `src/lib/` — the
  `Intl.NumberFormat` USD `currencyFormatter` is duplicated verbatim in
  `ExpenseList.tsx` and `RunningTotal.tsx` (flagged in iter-002 peer review).
- [ ] TD.2 — `applyExpenseEdit` carries through only `input` fields, dropping
  `existing.categoryId` / `recurring`. Harmless until P2.C (category edit UI) —
  fix when categories get an edit path (iter-003 peer review).
- [done] TD.3 — Deepen `AddExpenseForm` + `EditExpenseForm` into one `ExpenseForm`
  module — ~90% identical; differ only in initial values, submit label, Cancel,
  post-submit clear. Puts the form-validation guards in one place. — iter-005 / PR #14
- [ ] TD.4 — Deepen expense orchestration into a `useExpenses` hook — `App.tsx`
  repeats `store op → getAllExpenses() refresh → setState` across 3 handlers and
  couples directly to `expenseStore`; a hook concentrates it + becomes testable
  via `renderHook` (iter-003 arch pass). Note: iter-004 added the same pattern for
  categories (3 more handlers) — a `useCategories` hook is the parallel cleanup.
- [ ] TD.5 — Add an explicit DB-migration test — open `expense-tracker` at v1 with
  data, reopen at v2, assert `expenses` data survives and `categories` store exists
  (iter-004 peer review; currently only covered indirectly).

## Open dependencies (waiting on user)

- none — this app is local-only (IndexedDB), no API keys or external accounts required.
