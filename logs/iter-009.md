# iter-009

**Phase:** Phase 2 → Phase 3 boundary · **Mode:** arch-pass · **pr_mode:** true

## Output of the `improve-codebase-architecture` skill
Surfaced 4 deepening opportunities; executed 3 (TD.6 declined as product decision).
All 3 shipped as sequential PRs off `main`:

- **TD.1 (PR #23)** — `formatUSD` extracted into `src/lib/currency.ts`; three
  components import it (was: Intl.NumberFormat duplicated verbatim).
- **TD.2 (PR #24)** — `applyExpenseEdit` preserves optional fields the input
  omits. Contract: omit OR explicit-undefined → preserve.
- **TD.4 (PR #25)** — `useExpenses` + `useCategories` hooks; App.tsx loses 60
  lines and no longer imports `src/db/`. Methods return `Promise<boolean>` for
  chainable view-state (close edit form on success, reset filter on category
  delete). 11 new hook tests via `renderHook` + fake-indexeddb.

Final gate: **159 tests pass**, tsc + lint + build clean.

## How it went
- One arch-pass iter, 3 PRs back-to-back (not fat-iter parallel — protocol calls
  for one-shot arch refactors that don't fight a shared file).
- Each PR got CodeRabbit scoped + GitHub-app CodeRabbit + Class A super-reviewer.
  All approvals on second pass (or first, for the smaller PRs).
- Super-reviewer caught TWO real things this iter: (TD.4) noted the error UX is
  now domain-scoped (better — but a behaviour shift; documented in App.tsx),
  and the mount-load is no longer atomic (intermediate render possible between
  expense + category load — tests still pass, flagged for awareness).
- CodeRabbit: applied rounding-pin tests, misleading-title rename, update()
  error coverage. Declined: negative/NaN tests (gated by createExpense), and
  shared-factory abstraction for the two hooks (locality wins; deletion test
  says no).

## Decisions / notes
- **Hook contract = boolean return**, not throw. Both call sites need a success
  branch for view-state chaining; throwing would force try/catch in App for
  non-exceptional control flow. Locks in for Phase 3's `useMonthlyBudgets`.
- **Error display = domain-scoped** (`expensesHook.error || categoriesHook.error`).
  Previous shared-slot semantics cleared on any success; now scoped. The
  comment in App.tsx documents this so future readers don't read it as a bug.
- **TD.6 stays open** as a product decision (orphan vs. block vs. reassign).
  Current behaviour (orphan-via-Uncategorized) is coherent across all 3
  category-aware surfaces; no code change blocks Phase 3 progress.

## Wake-up handoff
- **Current phase:** Phase 3 — Budgets & insights. Starts now.
- **Next step:** iter-010 — pick **3–4 features** from Phase 3 for fat-iter.
  Candidates: P3.A (MonthlyBudget model + store), P3.C (Month switcher),
  P3.E (Monthly summary). P3.B (budget vs actual progress bar) depends on
  P3.A's data path — keep that one solo or pair with the store change in the
  same feature. P3.D (chart) and P3.F (over-budget warning) can land in
  iter-011. Independence check: P3.A owns new schema + new lib; P3.C owns App
  state for selected month; P3.E owns a new component. Zero pairwise overlap
  if the month-state shape is decided up front.
- **Files to open first:** `GOALS.md`, `ARCHITECTURE.md` (note data model line
  for MonthlyBudget), `src/db/db.ts` (need DB v3 + monthlyBudgets store),
  `src/hooks/useExpenses.ts` (template for `useMonthlyBudgets`), `src/App.tsx`.
- **Open questions:** (1) month-state shape — `'2026-05'` string seems
  simplest; lib helper `monthOf(dateISO)` returns first 7 chars. (2) Does the
  filter (P2.D) also scope by month, or are month + category orthogonal? Lean
  orthogonal — both filter the visible slice in series. (3) TD.5 (DB-migration
  test) should land in or before iter-010 since v3 schema bump is imminent.
- **Carry-forward:** TD.5 (DB-migration test — now load-bearing for v3),
  TD.6 (product decision).
- **Scheduled:** 600s (Phase 3 starts in impl mode; fat-iter parallel dispatch).
