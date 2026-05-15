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
- [done] P2.C — Assign category to expense — Category picker in the add/edit form. — iter-006 / PR #16
- [done] P2.D — Filter by category — Filter control above the expense list. — iter-008 / PR #21
- [done] P2.E — Category badges — Colored category badge on each expense row. — iter-007 / PR #18
- [done] P2.F — Spending by category — Totals grouped by category. — iter-007 / PR #19

## Phase 3 — Budgets & insights

- [done] P3.A — Monthly budget model — `MonthlyBudget` + IndexedDB store (DB v3),
  upsert semantics keyed by month. — iter-010 / PR #27
- [done] P3.B — Budget vs actual — Progress bar of monthly spend vs budget;
  budget is scoped to the month (not the category filter). — iter-011 / PR #31
- [done] P3.C — Month switcher — `MonthSwitcher` + `selectedMonth` state in App;
  filter pipeline composes `byMonth → byCategory`. — iter-010 / PR #29
- [done] P3.D — Spending chart — Pure SVG bar chart of spend per category for
  the visible slice. — iter-011 / PR #32
- [done] P3.E — Monthly summary — `summarizeExpenses` + `MonthlySummary`
  (total / average / count) wired to the visible slice. — iter-010 / PRs #28 & #29
- [done] P3.F — Over-budget warning — `--over` modifier on progress bar +
  `role="alert"` text when actual > budget. Bundled with P3.B. — iter-011 / PR #31

## Phase 4 — Polish & power features

- [done] P4.A — Search — Case-insensitive substring on description via
  `SearchBox` + `filterExpensesBySearch` plugged into useVisibleExpenses.
  — iter-013 / PR #36
- [done] P4.B — Date-range filter — `DateRangeFilter` + `filterExpensesByDateRange`
  (inclusive YYYY-MM-DD compare). Narrows visibleExpenses but NOT
  monthlyExpenses (budget-coherence). — iter-013 / PR #36
- [done] P4.C — CSV export — `ExportButton` triggers a Blob download
  (`expenses-YYYY-MM-DD.csv`) of the currently-visible (filtered) slice
  via `formatExpensesCsv`. — iter-014 / PR #39
- [done] P4.D — CSV import — `ImportButton` parses via `parseExpensesCsv`
  (header-required) and persists via `useExpenses.addMany` (skip-and-report
  policy). Header-error vs row-errors surface separately. — iter-014 / PR #39
- [done] P4.E — Recurring expenses — Separate `recurringTemplates` store
  (DB v3→v4, monthly frequency, dayOfMonth 1..28). Idempotent rollover
  via new optional `Expense.sourceTemplateId` field; `useEffect` in
  App.tsx fires on mount + selectedMonth change, calls
  `expensesHook.addMany(generateDueExpenses(due, month))`. New
  `<RecurringManager>` UI section. — iter-016 / PR #45
- [done] P4.F — Dark mode — `ThemeToggle` + `src/lib/theme.ts` + CSS custom
  properties; persisted to localStorage; first-paint applied in `main.tsx`.
  Component CSS not yet themable — see P4.I follow-up. — iter-013 / PR #37
- [done] P4.G — Empty + loading states — Shared `<EmptyState>` (role=status,
  title/hint/icon) + `<Spinner>` (role=status, sm/md/lg, prefers-reduced-
  motion fallback). Wired into ExpenseList, SpendingByCategory,
  MonthlySummary, SpendingChart, and App.tsx loading branch. — iter-015 / PR #42
- [done] P4.H — Responsive layout — ≤768px (tablet) and ≤480px (mobile)
  breakpoints across App.css + 17 component CSS files. Header stacks
  vertically on mobile; forms become full-width; ExpenseList rows wrap
  via flex+order; touch targets ≥44px everywhere (incl. CategoryManager).
  — iter-015 / PR #43
- [done] P4.I — Themability sweep — 16 component CSS files + `src/index.css`
  migrated from hard-coded hex/rgb to `var(--app-*)`. 3 new vars added
  (`--app-accent-fg`, `--app-surface-2`, `--app-surface-hover`). Light
  palette preserved; dark palette AA+ on all surfaces. — iter-014 / PR #40

## Phase 5 — Power-user persistence & data control

iter-017 phase-boundary arch pass surfaced 5 deepening candidates; TD.7
+ TD.8 shipped in iter-018. iter-019 triages the Phase 5 themes from
the post-arch handoff into concrete items below.

- [done] P5.A — URL filter persistence — `src/lib/urlFilters.ts` pure
  parse/serialize over URLSearchParams (stable key order: month, cat,
  q, from, to; silent-drop on invalid month/date). App.tsx lazy-inits
  filter state from the hash on first paint + `useEffect` writes back
  via `history.replaceState`. — iter-019 / PR #50
- [done] P5.B — JSON backup export — `src/lib/backup.ts` builds a
  versioned `BackupSnapshot { schemaVersion: 1, exportedAt, expenses,
  categories, monthlyBudgets, recurringTemplates }`; `<BackupExport>`
  triggers a Blob download `backup-YYYY-MM-DD.json`. Empty data ships
  a valid snapshot. — iter-019 / PR #50
- [done] P5.C — JSON backup restore — `src/lib/parseBackup.ts`
  (shallow shape validation, 3 error reasons + `BackupParseError`);
  `src/db/restoreBackup.ts` (atomic full-replace via one
  `db.transaction(STORES, 'readwrite')` — clear + add for all four
  stores in a single tx; throw aborts the whole tx);
  `<BackupRestore>` (file picker + native `<dialog>` confirmation +
  inline `role="alert"`/`role="status"`; jsdom fallback toggles `open`
  attribute). App.tsx wires `Promise.allSettled` over the four hooks'
  `refresh()` after the DB write commits. — iter-020 / PR #52
- [done] P5.D — Per-category budgets — new `categoryBudgets` store
  (DB v4→v5, composite string id `${month}|${categoryId}`),
  `useCategoryBudgets` hook (binds into `useStoredCollection`),
  `<CategoryBudgetManager>` UI section. Independent from
  `monthlyBudgets` for v1 — no implicit "month total = sum of
  per-category". Backup schema bumped 1→2 to include the new entity.
  — iter-021 / PR #54
- [done] P5.E — Multi-currency — single user-pref currency
  (`CurrencyCode = 'USD'|'EUR'|'GBP'|'JPY'`), localStorage-backed
  mirroring `theme.ts`. `useCurrency` hook + `<CurrencySelector>` UI;
  `formatCurrency(amount, code)` formatter with per-code cached
  `Intl.NumberFormat`. `currency` prop threaded through six money-
  rendering components. NOT per-expense for v1 (per-expense without
  conversion rates would mislead totals). — iter-022 / PR #56

## Phase 6 — Analytics, data portability, polish

iter-025 planning iter triaged the iter-022 candidate themes plus a
long-standing UX gap (TD.6 category-deletion cascade). Five items
picked; one candidate (per-expense currency with external FX rates)
explicitly **out-of-charter** for this testbed — the app is
local-only, adding a network dependency violates that charter.

- [done] P6.A — Recurring-template CSV export/import. New
  `src/lib/recurringCsv.ts` (`formatTemplatesCsv` + `parseTemplatesCsv`,
  header `description,amount,dayOfMonth,categoryId` — frequency
  excluded, always `'monthly'` today). `useRecurringTemplates.addMany`
  mirrors `useExpenses.addMany` (`BulkAddResult: {added, skipped,
  errors}`). New `<RecurringExport>` + `<RecurringImport>` components
  mirror `<ExportButton>` + `<ImportButton>`; `<RecurringManager>`
  renders both inline. Creates the 3rd consumer for the deferred
  TD.13 / TD.14 arch seams — Phase-6 → Phase-7 arch pass should
  pick them up. — iter-026 / PR #61
- [done] P6.B — Time-series analytics. New `src/lib/trends.ts`
  (`summarizeByMonth` ascending; `summarizeYear` fixed 12-slot grid).
  New `src/lib/year.ts` (currentYear/parseYear/prevYear/nextYear/
  formatYearLabel mirroring `month.ts`). New `<YearSwitcher>` mirrors
  `<MonthSwitcher>`. New `<TrendsChart>` pure-SVG, abbreviated Jan-Dec
  x-axis, single accent color via `.trends-chart__bar` (no inline
  fill), `<title>` tooltips with pluralized counts. App.tsx adds an
  always-visible Trends section (between insights and budget); reads
  from full `expensesHook.expenses` so user filters don't collapse
  the year view. — iter-027 / PR #62
- [ ] P6.C — Accessibility audit pass — sweep all components. Targets:
  (a) ARIA roles + labels on every interactive element; (b) keyboard
  navigation across all surfaces (Tab order, Escape closes modals,
  Enter submits); (c) focus management around `<dialog>` + after
  delete/add (return focus to caller); (d) screen-reader landmarks
  (`<main>`, `<nav>`, `aria-live` regions where missing); (e) form
  labels (`<label htmlFor>` over wrapper-label only); (f) AA color
  contrast verified component-by-component (app surfaces already AA;
  individual states like disabled buttons + placeholder text need a
  recheck). May ship across 2 PRs if the sweep is wide. Class A
  `design-review` agent gates the visual side.
- [ ] P6.D — Performance / bundle pass — Lighthouse-guided. Measure
  first (current bundle: 234.21 kB / gzip 71.33 kB). Targets:
  (a) code-split `RecurringManager`, `CategoryManager`, `BackupRestore`
  via `React.lazy` + `<Suspense>` since they're rare-use surfaces;
  (b) audit re-render hotspots via React DevTools profiler;
  (c) memoize expensive aggregations (`summarizeByMonth` etc.);
  (d) defer non-critical CSS if Lighthouse flags it. Ship measurement
  + improvement together; report before/after numbers in the iter log.
- [done] P6.E — Category-deletion cascade UX (block-while-in-use,
  closes TD.6). New `categoryMessages.inUse(count)` pluralized factory.
  `useCategories.setError` exposed; hook stays domain-pure (no
  `useExpenses` import). `<CategoryManager>` gains optional
  `getInUseCount` prop; Delete disabled + "· N expense(s)" annotation
  when count > 0. `App.tsx.handleDeleteCategory` checks count BEFORE
  remove; defense-in-depth at three layers (UI disable + App guard +
  hook unchanged). — iter-026 / PR #61

### Deferred (out of Phase 6 scope)

- **Per-expense currency with FX conversion rates** — would require
  fetching live exchange rates from a network API. This app is
  **local-only by charter** (CLAUDE.md: "no backend, no server,
  single-user, local-only"). Revisit only if a snapshot-bundle FX
  pattern emerges that doesn't break the local-only invariant. The
  iter-022 P5.E single-pref-currency is the current ceiling for
  currency support.

## Tech debt

- [done] TD.1 — Extract a shared `formatUSD` helper into `src/lib/currency.ts`;
  three components import it instead of constructing their own
  `Intl.NumberFormat`. — iter-009 / PR #23
- [done] TD.2 — `applyExpenseEdit` now preserves `categoryId` / `recurring`
  from `existing` when the input doesn't supply them. Contract: omit OR
  explicit-undefined → preserve. — iter-009 / PR #24
- [done] TD.3 — Deepen `AddExpenseForm` + `EditExpenseForm` into one `ExpenseForm`
  module — ~90% identical; differ only in initial values, submit label, Cancel,
  post-submit clear. Puts the form-validation guards in one place. — iter-005 / PR #14
- [done] TD.4 — `useExpenses` + `useCategories` hooks own state + load +
  mutations + error. Methods return `Promise<boolean>` so callers chain
  view-state. App.tsx no longer imports `src/db/`. — iter-009 / PR #25
- [done] TD.5 — DB-migration test added (`src/db/dbMigration.test.ts`). Opens DB
  at v2 directly, seeds an expenses row, reopens via `openDb()` at v3, asserts
  the expense survives + `monthlyBudgets` store exists + a budget round-trips.
  — iter-010 / PR #27
- [done] TD.6 — Category-deletion cascade resolved: block-while-in-use
  (promoted to P6.E in iter-025, shipped in iter-026 / PR #61).
- [done] TD.7 — Generic `useStoredCollection<T, TInput, K>` hook —
  extracted the shared CRUD-hook shape over a small `Store<T, K>`
  interface; optional `update` + `bootstrap`; `setError` + `refresh`
  escape hatches. Four domain hooks now thin wrappers (~50-90 LOC,
  down from ~70-150). — iter-018 / PR #48
- [done] TD.8 — `src/lib/errorMessages.ts` constants map — frozen
  per-domain message bundles (`expenseMessages`, `categoryMessages`,
  `budgetMessages`, `recurringTemplateMessages`). Bundled with TD.7.
  — iter-018 / PR #48
- [done] TD.9 — Generic `makeStore<T, K>` IndexedDB factory at
  `src/db/store.ts` returning `{ add, put, getAll, get, remove }`.
  Five domain stores collapsed to thin re-export wrappers; domain
  helpers (`seedDefaultCategories`, `categoryBudgetId`) stay in their
  modules. +5 factory tests against the real fake-indexeddb seam.
  — iter-024 / PR #59
- [ ] TD.10 — Pure `src/lib/expenseVisibility.ts` pipeline — orchestrate
  the 4-stage filter chain + budget-coherence carveout as a pure
  function. `useVisibleExpenses` collapses to a single `useMemo`.
  **Deferred** — no non-React consumer demands it yet. Revisit if one
  appears. (iter-017 arch pass)
- [ ] TD.12 — `useStoredCollection` refresh-after-mutation error isolation
  — CR-flagged latent issue (iter-018, but preserves pre-iter-018
  behavior of every domain hook). Today, if `store.add/update/remove`
  succeeds but the post-mutation `store.getAll()` throws, the outer
  try-catch fires `setError(messages.add)` and returns `false` — but
  the mutation actually persisted. User sees "Failed to..." and may
  retry → potential duplicate. Fix: nest the refresh in its own
  try-catch, return `true` (mutation succeeded), and surface
  `messages.load` instead. Will change the `Promise<boolean>` contract
  for the storage-flaky case; coordinate with test updates across all
  four hooks before flipping.
- [done] TD.11 — Vestigial `Expense.recurring?: boolean` dropped from
  the type + `ExpenseInput` + `validateExpenseInput` + `applyExpenseEdit`
  preservation branch. CSV format narrowed 5→4 columns. `sourceTemplateId`
  is the canonical recurring-template marker. — iter-024 / PR #59
- [ ] TD.13 — `makeDownloadBlob(filename, mime, body)` seam —
  `ExportButton` + `BackupExport` duplicate the Blob+anchor+revoke
  dance. Only 2 consumers today; **deferred** until a 3rd consumer
  lands (PDF/zip export in Phase 6+). (iter-023 arch pass)
- [ ] TD.14 — `useFileRestoreFlow` hook — `ImportButton` +
  `BackupRestore` share file-picker → parse → execute. `BackupRestore`
  adds a confirmation `<dialog>` branch; hook would need a "no dialog"
  knob. Only 2 consumers; **deferred** until a 3rd consumer (e.g.
  bulk-replace CSV import) commits. (iter-023 arch pass)
- [ ] TD.15 — `src/lib/backupPipeline.ts` barrel — three lib files
  (`backup.ts` + `parseBackup.ts` + `restoreBackup.ts`) + two
  components touch the snapshot shape. Single barrel re-exporting
  `BackupSnapshot` + build/parse/validate concentrates future
  schema bumps. Bundle into iter-024 IF the cleanup-week diff stays
  small; otherwise defer to a backup-schema-evolution iter.
  (iter-023 arch pass)
- [done] TD.16 — `formatUSD` shim deleted from `src/lib/currency.ts`
  + pinned test block removed from `currency.test.ts`. Two stale
  test descriptions in `MonthlySummary.test.tsx` +
  `SpendingChart.test.tsx` renamed `formatUSD`→`formatCurrency`.
  — iter-024 / PR #59
- [ ] TD.17 — App-level category-delete guard at
  `App.tsx.handleDeleteCategory` is defense-in-depth but not directly
  exercised by a test — UI disable short-circuits the click, so the
  count-check branch survives only as a backstop for future refactors
  that might remove the UI disable. Add a focused test that bypasses
  the UI disable (e.g. lifting `handleDeleteCategory` to a testable
  seam) and verifies the App-layer block + inUse error. Low priority
  — purely test-coverage. (iter-026 super-reviewer nit)

## Open dependencies (waiting on user)

- none — this app is local-only (IndexedDB), no API keys or external accounts required.
