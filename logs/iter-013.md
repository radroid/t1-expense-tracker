# iter-013

**Phase:** Phase 4 — Polish & power features · **Mode:** fat-iter (3 features,
2 PRs) · **pr_mode:** true

## Features landed
- **P4.A + P4.B (PR #36)** — search + date-range. Both extend `useVisibleExpenses`
  through the seam from iter-012. Pipeline: `byMonth → monthlyExpenses →
  byDateRange → byCategory → bySearch → visibleExpenses`. `monthlyExpenses`
  bypasses byDateRange → budget-coherence invariant holds. CodeRabbit clean.
- **P4.F (PR #37)** — dark mode. CSS custom properties + localStorage seam +
  first-paint apply in `main.tsx`. ThemeToggle is self-contained.

Final gate: **280 tests pass**, tsc + lint + build clean.

## How it went
- Parallel dispatch (P4.A+B + P4.F disjoint file sets). Process-fix held
  end-to-end this iter — staged by explicit path on every commit; no `-A`,
  no recovery branches.
- Two super-reviewer passes, both APPROVE. CR clean on P4.A+B; 2 nits on
  P4.F (persisted-load test missing + hardcoded storage key) — both applied.

## Decisions / notes
- **Filter pipeline ordering** (P4.A+B): byMonth → byDateRange → byCategory
  → bySearch. Filters are commutative (each is a pure subset operation), so
  order is correctness-irrelevant — but byMonth-first is cheapest-narrowing
  for typical data.
- **Budget-coherence invariant** continues from iter-011: budget is "this
  month's commitment vs this month's actual." Date-range narrows the
  display slice but NOT the budget reading. Locked by a dedicated hook test.
- **Dark mode scope cut** (P4.F): App.css uses the new vars on the shell
  chrome, but per-component CSS still hard-codes light colors. Toggle works,
  but cards/inputs render light against the dark shell. Surfaced by super-
  reviewer; logged as **P4.I (themability sweep)** in GOALS.md.

## Wake-up handoff
- **Current phase:** Phase 4. Done: P4.A, P4.B, P4.F. Remaining: P4.C (CSV
  export), P4.D (CSV import), P4.E (recurring), P4.G (empty/loading polish),
  P4.H (responsive), P4.I (themability sweep — surfaced this iter).
- **Next step:** iter-014 — fat-iter candidates: **P4.C (CSV export — small,
  pure)** + **P4.D (CSV import — needs validation + bulk-add)** + **P4.I
  (themability sweep)**. P4.C and P4.D share a `src/lib/csv.ts` parser/
  formatter; bundle them as one PR. P4.I is fully orthogonal (just touches
  the per-component CSS files to swap hard-coded colors for vars). Two PRs.
- **Files to open first:** `GOALS.md`, `src/hooks/useExpenses.ts` (CSV import
  needs a bulk-add method or N single-adds via the existing `add`), the
  component CSS files for P4.I (`ExpenseList.css`, `CategoryFilter.css`,
  `MonthSwitcher.css`, `ExpenseForm.css`, `BudgetForm.css`), and
  `src/index.css` (the var palette).
- **Open questions:** (1) CSV import — header row required or sniffed? Lean
  required + reject otherwise. (2) Bulk-add validation — partial-failure
  policy (rollback all on first invalid row, or skip-and-report)? Lean
  skip-and-report with a count. (3) P4.I — should we add new CSS vars
  (e.g. `--app-input-bg`, `--app-button-bg`, `--app-button-hover-bg`) or
  reuse the existing 8? Lean: add 2-3 more vars rather than overloading
  semantic meanings.
- **Carry-forward:** TD.6 (category-deletion cascade — product decision
  still pending); deferred `useSpendingByCategory` (pair with P4.G); P3.D
  chart `<text>` aria-hidden follow-up; centralise localStorage test shim
  in `src/test/setup.ts` when 2nd consumer lands; DateRangeFilter `from>to`
  normalize (super-review nit, low-priority).
- **Scheduled:** 600s (impl iter — Phase 4 continues).
