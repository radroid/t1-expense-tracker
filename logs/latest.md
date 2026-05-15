# Latest

Latest: iter-020 — P5.C (JSON backup restore) shipped (PR #52). Three
of five Phase 5 features done (P5.A, P5.B, P5.C). Full export/import
loop closed: a user can now snapshot all four stores and atomically
restore the snapshot back.

Stage: S3 (Phase 5 in flight — 3/5 features done) — see
  `.loop/state.json` (`pr_mode: true`, `pr_size_policy: fat`)
Next step: iter-021 — **P5.D (per-category budgets)** as a
  single-feature impl iter. Vertical slice: new `categoryBudgets`
  store (DB v4 → v5; composite key `${month}|${categoryId}`);
  `src/lib/categoryBudget.ts` factory; `useCategoryBudgets` hook
  (binds into the `useStoredCollection` seam from iter-018); new
  `<CategoryBudgetManager>` section (mirror `<RecurringManager>`
  pattern). Behavior decision: per-category budgets are INDEPENDENT
  from the existing month-total budget for v1 (no implicit "month
  total = sum of per-category" coupling). Revisit in v2 if users want
  it.
Open first: `GOALS.md` (P5.D), `src/lib/budget.ts` +
  `src/hooks/useMonthlyBudgets.ts` (reference shape), `src/components/BudgetVsActual.tsx`
  + `src/components/BudgetForm.tsx` (UI dependencies), `src/db/db.ts`
  (DB version bump), `src/db/dbMigration.test.ts` (extend migration
  test).
Open blocks: none open — see `logs/blocks.md` for iter-020 super-
  reviewer notes (APPROVE high confidence; atomicity + jsdom dialog
  fallback both verified).
Carry-forward: TD.6 (category-deletion cascade — product decision
  pending); TD.9 (makeStore factory); TD.10 (expenseVisibility.ts —
  deferred); TD.11 (drop vestigial Expense.recurring — deferred);
  TD.12 (useStoredCollection refresh-after-mutation error isolation);
  deferred `useSpendingByCategory` typing pair-up; P3.D chart text
  aria-hidden follow-up; centralise localStorage test shim (Node 25
  shim is still per-test-file); DateRangeFilter from>to normalize
  (low priority); CSV-injection prefix-escape on export (low
  priority); empty-state trailing-period normalize; P4.G follow-up:
  spinner covers insights section; CSV export/import of recurring
  templates; Blob-revoke race in Export/BackupExport (declined CR
  nit, logged iter-019); filename-vs-exportedAt timezone skew in
  BackupExport.
Test gate: 451 tests pass; `npm run build` + `npm run lint` clean.
Push: n/a — pr_mode, all work merged via PRs.

Last-iter shipped:
- P5.C (#52): `src/lib/parseBackup.{ts,test.ts}` (shape validator with
  three typed error reasons); `src/db/restoreBackup.{ts,test.ts}`
  (atomic full-replace via one `db.transaction([...STORES],
  'readwrite')`); `src/components/BackupRestore.{tsx,test.tsx,css}`
  (file picker + native `<dialog>` + jsdom feature-detect fallback);
  `src/App.tsx` (wires BackupRestore with `Promise.allSettled` hook
  refresh fan-out — refresh failure ≠ data-loss since DB write
  already committed); four hook wrappers expose `refresh()`
  passthrough (justified scope creep — required by spec contract).
  +18 tests.

Operational notes for iter-021:
  - **DB version is currently 4** (iter-016 P4.E). P5.D bumps to 5.
    Test cycle: v3→v4 migration test (iter-016) + v4→v5 migration
    test (iter-021).
  - **`useStoredCollection` is the established seam** for new stores
    — `useCategoryBudgets` should bind into it with a frozen
    messages bundle in `src/lib/errorMessages.ts`. Don't re-roll the
    CRUD pattern.
  - **Composite key pattern**: lean string composite (`${month}|${
    categoryId}`) over array tuple — consistent with `monthlyBudgets`
    keyed by `month` and simpler IDB lookups.
  - **Cadence:** 600s (impl iter).
  - **Process-fix held**: explicit-path staging on every commit.
    Nine-iter streak. Keep it up.
  - `vite.config.ts` `fileParallelism: false` still load-bearing.
  - **App.test hash-reset pattern (iter-019)** still load-bearing for
    any test mounting App.

Open questions for iter-021 (P5.D):
  (1) Composite key — `${month}|${categoryId}` string vs array tuple
      key path? Lean: string.
  (2) UI — new `<CategoryBudgetManager>` section vs per-category
      strip in `<BudgetVsActual>`? Lean: new section (mirror
      RecurringManager).
  (3) Coupling — independent reads vs implicit "month total = sum"?
      Lean: independent for v1; revisit if users want.
  (4) DB v4 → v5 migration — backfill empty (consistent with v3 → v4
      for recurringTemplates). Lean yes.
