# iter-012

**Phase:** Phase 3 → Phase 4 boundary · **Mode:** arch-pass · **pr_mode:** true

## Output of the `improve-codebase-architecture` skill
Surfaced 3 candidates. Executed 1 (PR #34); declined 1 with reason; deferred 1.

### Executed (PR #34, super-review APPROVE)
**`useVisibleExpenses` hook** — composes the filter pipeline into one seam.
- `src/hooks/useVisibleExpenses.ts` — inputs `{ expenses, selectedMonth,
  categoryFilter, categories }`; outputs `{ monthlyExpenses, visibleExpenses }`.
  Two `useMemo` layers; flipping the category filter doesn't re-walk the month
  filter.
- 4 unit tests covering composition, narrowing semantics, ref stability,
  memo-invariant.
- App.tsx loses 12 lines (two inline `filterExpensesBy*` calls + imports).
- CR caught a genuine test bug (memo assertion compared against the wrong
  prior ref — passed for the wrong reason under `filter='all'` aliasing).
  Applied.

Final gate: **243 tests pass**, tsc + lint + build clean.

### Declined: data-hook factory (`useExpenses` + `useCategories` + `useMonthlyBudgets`)
Deletion test: each hook has unique validation, error message, load path
(seed-on-empty for categories; upsert for budgets; validate-then-write for
expenses). A factory would push divergence into config objects without
removing it. Super-reviewer concurred.

### Deferred: `useSpendingByCategory`
Two callsites (`SpendingByCategory` + `SpendingChart`) with identical args is
borderline. Pair with P4.G (empty-state polish) when it lands so the
interface is shaped by real requirements, not speculation.

## How it went
- Pure arch-pass iter, one PR. No fat-iter (arch pass is one-shot per protocol).
- Process-fix discipline held: staged by explicit path on each commit
  (`git add src/...` not `-A`). No recovery branch needed. Two iters in a row
  bit me on `-A`; this iter cleanly avoided it.
- Super-reviewer flagged the deletion-test outcome as "thin but justified" —
  one caller today, but the named return clarifies the BudgetVsActual
  invariant that was previously a code comment, and Phase 4 will exercise the
  seam.

## Wake-up handoff
- **Current phase:** Phase 4 — Polish & power features. Starts now.
- **Next step:** iter-013 — fat-iter candidates: **P4.A (search across
  expense descriptions)** + **P4.B (date-range filter)** + **P4.F (dark mode,
  localStorage)**. P4.A and P4.B both extend `useVisibleExpenses` with new
  view-state params; they're naturally disjoint at the file level (P4.A
  adds a search box component, P4.B adds a date-range component, the hook
  absorbs both signatures). P4.F is fully orthogonal (theme toggle + CSS
  custom properties + localStorage adapter — no overlap with the filter
  pipeline). Three features, three PRs.
- **Files to open first:** `GOALS.md`, `src/hooks/useVisibleExpenses.ts`
  (the seam being extended), `src/App.tsx`, `src/index.css` (where dark-mode
  CSS variables would live), `src/lib/expenseFilter.ts`.
- **Open questions:** (1) P4.B date-range — UI shape? Two `<input type="date">`
  pickers above the list (mirrors MonthSwitcher placement) or inline near the
  filter dropdown? Lean: own component below MonthSwitcher. (2) P4.B + P4.C
  month-switcher interplay — if user picks a date range spanning two months,
  what does the MonthSwitcher show? Lean: dim/disable MonthSwitcher when a
  date range is active, OR auto-clear the date range when month is switched.
  Decide in plan. (3) P4.F dark-mode storage key — `expense-tracker:theme`?
  Lean yes.
- **Carry-forward:** TD.6 (category-deletion cascade — product decision still
  pending); deferred `useSpendingByCategory` (pair with P4.G); P3.D chart
  `<text>` aria-hidden follow-up.
- **Scheduled:** 600s (impl iter — Phase 4 starts in fat-iter mode).
