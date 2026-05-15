# iter-023

**Phase:** Phase 5 → Phase 6 boundary — **mandatory arch pass**
· **Mode:** thinking-iter (no feature code shipped)
· **pr_mode:** true

## What ran

1. Loaded the `autonomous-build-loop` skill (Tier-1 protocol read).
2. Invoked the `improve-codebase-architecture` skill — **real tool
   call**, per the phase-boundary hard rule.
3. Dispatched a single `Explore` agent for an organic codebase walk
   (5 stores + backup pipeline + useStoredCollection + 5 consumers +
   useVisibleExpenses + currency.ts + Expense.recurring vestige).
4. Logged 6 candidates with deletion-test analysis to
   `logs/blocks.md` under `## iter-023 — Phase-5 → Phase-6 arch
   pass` with `**Source:** arch-pass`.

No production code touched. Test count unchanged at 527.

## Candidates surfaced

| # | Title | Verdict | TD |
|---|---|---|---|
| 1 | `makeStore<T, K>` factory | **PICK** for iter-024 | TD.9 (carried) |
| 2 | `makeDownloadBlob` seam | DEFER (need 3rd consumer) | TD.13 (new) |
| 3 | `useFileRestoreFlow` hook | DEFER (need 3rd consumer) | TD.14 (new) |
| 4 | Delete `formatUSD` shim | **PICK** (pair) | TD.16 (new) |
| 5 | Drop `Expense.recurring` | **PICK** (pair) | TD.11 (carried) |
| 6 | `backupPipeline.ts` barrel | bundle-if-scope-allows | TD.15 (new) |

Re-evaluated iter-017 deferrals: **TD.10** (expenseVisibility
pipeline) still has no non-React consumer — continue deferring.
**TD.12** (useStoredCollection refresh-after-mutation isolation):
5 consumers + 5 iters since the refactor, no real-world symptom —
deferring is fine.

## Decisions

- **iter-024 = cleanup-week**: TD.9 (primary refactor over 5
  store files) + TD.11 (drop vestigial field) + TD.16 (delete
  shim). All three converge on "subtract code, narrow types,
  flatten interfaces". TD.15 bundles in if the diff stays small.
- **Phase 6 themes deferred** to post-cleanup-week. The arch
  pass deliberately did NOT pick a Phase 6 line yet — concrete
  triage happens at iter-025 planning, after the cleanup lands.
- **Three-consumer rule** held for TD.13 + TD.14. Two-adapter
  refactors don't earn a seam; the duplication is cheaper than the
  lift, today.

## Operational notes

- Process-fix held: explicit-path staging on every commit
  (twelve-iter streak).
- `vite.config.ts` `fileParallelism: false` still load-bearing.
- localStorage shim remains centralised in `src/test/setup.ts`.

## Wake-up handoff

- **Current phase:** Phase 5 CLOSED; Phase 6 stub in place,
  concrete items TBD by iter-025.
- **Next step:** **iter-024 = cleanup-week.** Ship:
  - **TD.9** — `makeStore<T, K>` factory in `src/db/store.ts`,
    fold 5 store files (`expenseStore`, `categoryStore`,
    `budgetStore`, `recurringTemplateStore`, `categoryBudgetStore`)
    into thin re-exports. `seedDefaultCategories` + composite-key
    plumbing stay in their domain modules. Single PR.
  - **TD.11** — drop `Expense.recurring?: boolean` from the type
    + remove preservation branch in `applyExpenseEdit` + clean up
    csv tests. Pure subtraction. Same PR as TD.9 IF small, else
    a follow-up PR within the same iter.
  - **TD.16** — delete `formatUSD` shim from `src/lib/currency.ts`;
    update the pinned test that exercises it; rename stale test
    descriptions in `MonthlySummary.test.tsx` +
    `SpendingChart.test.tsx`. Pure subtraction.
  - **TD.15** — bundle ONLY if the above three keep the diff under
    ~600 LOC net. Otherwise defer.
- **Cadence:** 600s (impl-iter — concrete refactor work).
- **Carry-forward (full list):** TD.6 (category-deletion cascade,
  product decision pending); TD.10 (expenseVisibility pipeline —
  still no non-React consumer); TD.12 (useStoredCollection
  refresh-after-mutation — preserve until a real symptom surfaces);
  TD.13, TD.14, TD.15 (per arch-pass deferral rules); deferred
  `useSpendingByCategory` typing pair-up; P3.D chart text
  aria-hidden; DateRangeFilter from>to normalize; CSV-injection
  prefix-escape; empty-state trailing-period normalize; P4.G
  follow-up (spinner covers insights); CSV export/import of
  recurring templates; Blob-revoke race in Export/BackupExport;
  filename-vs-exportedAt timezone skew.
- **Files to open first for iter-024:** `src/db/db.ts`,
  `src/db/expenseStore.ts`, `src/db/categoryStore.ts` (the
  factory's first 3 callers); `src/lib/expense.ts` (TD.11);
  `src/lib/currency.ts` + `currency.test.ts` (TD.16);
  `logs/blocks.md` ## iter-023 section for the candidate
  rationale.
