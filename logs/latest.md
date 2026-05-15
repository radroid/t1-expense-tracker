# Latest

Latest: iter-018 — TD.7 (`useStoredCollection<T, TInput, K>` generic) +
TD.8 (errorMessages.ts map) shipped together (PR #48). Iter-017 arch
pass candidates #1 + #2 done. Four domain hooks are now thin wrappers
on a single CRUD seam.

Stage: S3 (Phase 5 underway — 1 refactor landed) — see `.loop/state.json`
  (`pr_mode: true`, `pr_size_policy: fat`)
Next step: iter-019 — **Phase 5 feature triage**. The Phase 5 backlog
  is a stub of candidate themes (per-category budgets, multi-currency,
  JSON backup/restore, URL filter persistence) — pick one concrete
  feature to scope and ship. Lean candidates ranked by impact: (1)
  per-category budgets (extends the budget pipeline meaningfully); (2)
  JSON backup/restore (full-state portability, distinct from CSV which
  only handles expenses). Park TD.9 (makeStore factory) for iter-020+
  to give TD.7 one iter of stability.
Open first: `GOALS.md` Phase 5 stub (under `## Phase 5`); `logs/blocks.md`
  ## iter-017 arch pass section (theme list); `src/lib/budget.ts` +
  `src/hooks/useMonthlyBudgets.ts` (if per-category budgets is picked);
  `src/lib/csv.ts` (reference for backup-shape if JSON is picked).
Open blocks: none open — see `logs/blocks.md` for iter-018 super-reviewer
  notes (APPROVE high confidence; one perf nit — first-mount has a
  redundant `getAllCategories` round-trip vs the old hook; behavior
  identical).
Carry-forward: TD.6 (category-deletion cascade — product decision
  pending); TD.9 (makeStore factory — sequenced for iter-020+); TD.10
  (expenseVisibility.ts — deferred); TD.11 (drop vestigial
  Expense.recurring — deferred); **TD.12** (useStoredCollection
  refresh-after-mutation error isolation — logged iter-018; preserves
  pre-refactor behavior, requires coordinated test changes to flip);
  deferred `useSpendingByCategory` typing pair-up; P3.D chart text
  aria-hidden follow-up; centralise localStorage test shim;
  DateRangeFilter from>to normalize; CSV-injection prefix-escape;
  empty-state trailing-period normalize; P4.G follow-up:
  loading-covers-insights; CSV export/import of recurring templates.
Test gate: 388 tests pass; `npm run build` + `npm run lint` clean.
Push: n/a — pr_mode, all work merged via PRs.

Last-iter shipped:
- TD.7 + TD.8 (#48): `src/hooks/useStoredCollection.{ts,test.ts}` (new);
  `src/lib/errorMessages.{ts,test.ts}` (new — frozen per-domain
  bundles); refactored `useExpenses.ts`, `useCategories.ts`,
  `useMonthlyBudgets.ts`, `useRecurringTemplates.ts` to thin wrappers.
  +15 generic tests + 5 errorMessages tests. Zero pre-existing test
  file edits — test-preservation was the contract gate. tsc + lint +
  build clean.

Operational notes for iter-019:
  - **Cadence:** 1500s (plan-iter — Phase 5 feature triage; impl pace
    returns when first Phase 5 feature is scoped).
  - **Process-fix held**: explicit-path staging on every commit.
    Seven-iter streak. Keep it up.
  - `vite.config.ts` `fileParallelism: false` still load-bearing — keep.
  - **The hook seam is now `useStoredCollection`** — any new
    domain-collection (e.g. per-category-budgets) should bind into it
    rather than re-implementing the CRUD-state pattern.
  - **`errorMessages.ts`** — when adding a new domain, add a frozen
    message bundle there (don't inline strings in the hook).
  - Node 25 localStorage shim hack still per-test-file. Centralise
    when 2nd consumer lands.

Open questions for iter-019 (feature triage):
  (1) Per-category budgets — extend `MonthlyBudget` with a category
      dimension OR a new `categoryBudgets` store keyed on
      (month, categoryId)? Lean: new store (preserves single-purpose
      MonthlyBudget; binds into useStoredCollection with a composite
      key). Then the BudgetVsActual UI shows total + per-category
      progress.
  (2) Multi-currency — single-currency-per-expense field on Expense or
      per-user setting? Lean: per-expense field; per-user becomes a
      display preference. Adds noise to validation + CSV.
  (3) JSON backup/restore — distinct from CSV (full state). Smaller
      scope than per-category budgets; good iter-019 if per-category
      is over-scoped.
  (4) URL filter persistence — smallest scope; useful but low-impact.
      Park unless iter-019 wants a tiny feature.
