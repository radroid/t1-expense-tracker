# iter-010

**Phase:** Phase 3 — Budgets & insights · **Mode:** fat-iter (3 features) · **pr_mode:** true

## Features landed
- **P3.A (PR #27)** — `MonthlyBudget` lib + store; DB v3 with per-store keyPath
  (`monthlyBudgets` keyed by `month`); upsert semantics. **TD.5 closed** by
  `src/db/dbMigration.test.ts` (v2 → v3 round-trip with data survival).
- **P3.E (PR #28)** — `summarizeExpenses(expenses)` + `<MonthlySummary>` (pure
  lib + pure renderer; empty path returns `{ 0, 0, 0 }` not NaN).
- **P3.C (PR #29)** — `src/lib/month.ts` helpers; `<MonthSwitcher>`;
  `filterExpensesByMonth`; App state `selectedMonth` initialised to
  `currentMonth()`. Filter composition is now `byMonth → byCategory →
  visibleExpenses`; ExpenseList, RunningTotal, SpendingByCategory, and
  MonthlySummary all render the visible slice.

Final gate: **206 tests pass**, tsc + lint + build clean.

## How it went
- Parallel dispatch (P3.A + P3.E disjoint file sets) ran cleanly; main agent
  did P3.C (the App.tsx-touching feature) sequentially.
- Three super-reviewer passes (one per PR), all APPROVE. CodeRabbit nits
  applied where actionable, declined with reasons where YAGNI / upstream-gated.
- One sub-agent integration mishap: `git add -A` on the P3.A branch swept in
  P3.E's untracked files. Force-push to fix was correctly denied by the
  auto-classifier; recovered by creating a clean replacement branch. **Process
  fix logged**: explicit file paths in `git add` for fat-iter integration.
- Hit a test-suite flakiness ceiling: fake-indexeddb under parallel vitest
  workers tripped 1000ms findBy timeouts. Fix: `fileParallelism: false` in
  `vite.config.ts`. Suite is now deterministic at ~20s.

## Decisions / notes
- **Filter composition** is associative (both filters are pure over the same
  array) — `byMonth → byCategory` order was chosen so the typed `monthlyExpenses`
  slice is conceptually "this month's expenses" before category narrowing.
- **selectedMonth init** uses `useState(currentMonth)` (lazy init pattern, not
  `currentMonth()`). React invokes once at mount; state holds a string.
  CodeRabbit flagged it as a missing-parens bug; declined with a comment.
- **Month-state shape** = `'YYYY-MM'` string (matches MonthlyBudget key).
  All Date arithmetic lives in `src/lib/month.ts`; callers stay string-only.

## Wake-up handoff
- **Current phase:** Phase 3. Done: P3.A, P3.C, P3.E + TD.5. Remaining:
  **P3.B (budget vs actual)**, **P3.D (spending chart)**, **P3.F (over-budget
  warning)**.
- **Next step:** iter-011 — fat-iter candidates: **P3.B** (set/show budget for
  selected month with progress bar) + **P3.D** (bar chart per category for
  selected month) + **P3.F** (over-budget visual when spend > budget). P3.B
  and P3.F share the budget data path (P3.F is a render variant of P3.B's
  ratio); pair them or land P3.B solo then P3.F as a polish PR. P3.D is
  independent (chart of `spendingByCategory` for the visible slice).
- **Files to open first:** `GOALS.md`, `src/hooks/useExpenses.ts` (template
  for `useMonthlyBudgets`), `src/App.tsx`, `src/lib/categoryTotals.ts`
  (`spendingByCategory` is the chart's data source).
- **Open questions:** (1) P3.D chart — pure SVG vs a tiny dep? Lean pure SVG,
  no dep churn. (2) P3.B's BudgetForm — inline in the header next to
  MonthSwitcher, or its own section like CategoryManager? Lean inline +
  read-only display; edit via modal/inline-edit later. (3) Should the
  RunningTotal also surface `vs budget` once P3.B lands? Probably yes —
  but P3.F can take that.
- **Carry-forward:** TD.6 (category-deletion cascade — product decision,
  still pending).
- **Scheduled:** 600s (impl iter).
