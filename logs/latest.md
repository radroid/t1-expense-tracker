# Latest

Latest: iter-010 — Phase 3 fat-iter shipped 3 PRs (P3.A #27, P3.E #28, P3.C #29).
MonthlyBudget data layer + DB v3 + MonthSwitcher + MonthlySummary + month filter
all live. **TD.5 closed**. Filter composition: `byMonth → byCategory → visible`.

Stage: S3 (feature dev) — see `.loop/state.json` (`pr_mode: true`, `pr_size_policy: fat`)
Next step: iter-011 — Phase 3 fat-iter, remaining features: **P3.B** (budget vs
  actual with progress bar) + **P3.D** (spending bar chart) + **P3.F** (over-budget
  warning). P3.B + P3.F share the budget data path; pair them or sequence
  B → F. P3.D is independent (chart of spendingByCategory for the visible slice).
Open first: `GOALS.md`, `src/hooks/useExpenses.ts` (template for `useMonthlyBudgets`),
  `src/App.tsx`, `src/lib/categoryTotals.ts` (chart's data source), `src/lib/budget.ts`.
Open blocks: none open — see `logs/blocks.md` for iter-010 super-reviewer notes
  and the parallel-dispatch process-fix note.
Carry-forward: TD.6 (category-deletion cascade — product decision still pending).
Test gate: 206 tests pass; `npm run build` + `npm run lint` clean.
Push: n/a — pr_mode, all work merged via PRs.

Last-iter shipped:
- P3.A (#27): `src/lib/budget.ts` + `src/db/budgetStore.ts` + DB v3 (per-store
  keyPath) + TD.5 migration test.
- P3.E (#28): `src/lib/monthlyTotals.ts::summarizeExpenses` + `<MonthlySummary>`
  (Total / Average / Count; empty path → zero-summary, no NaN).
- P3.C (#29): `src/lib/month.ts` (currentMonth, monthOf, prev/next, formatMonthLabel)
  + `<MonthSwitcher>` (prev/label/next, 44px targets) + `filterExpensesByMonth`.
  App wires selectedMonth state (lazy-init via `useState(currentMonth)`) and
  renders both MonthSwitcher + MonthlySummary.

Operational notes for iter-011:
  - `vite.config.ts` has `fileParallelism: false` — fake-indexeddb scales poorly
    under parallel vitest workers. Don't remove without a perf check.
  - When staging sub-agent fat-iter output, use explicit file paths in `git add`
    (not `-A`) so untracked files from other features don't sweep onto the wrong
    branch. Process-fix lesson from this iter's recovery.

Open questions for iter-011 (note in plan):
  (1) P3.D chart — pure SVG vs a tiny chart dep? Lean pure SVG.
  (2) P3.B BudgetForm — inline near the MonthSwitcher, or its own section?
      Lean inline + read-only display first.
  (3) Should RunningTotal surface 'vs budget' once P3.B lands? Probably yes,
      but P3.F is the natural carrier.
