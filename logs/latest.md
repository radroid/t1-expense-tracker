# Latest

Latest: iter-021 — P5.D (per-category budgets) shipped (PR #54). Four
of five Phase 5 features done. New `categoryBudgets` store (DB v4→v5),
composite-string id, independent from month-total budgets, backup
schema bumped 1→2.

Stage: S3 (Phase 5 in flight — 4/5 features done) — see
  `.loop/state.json` (`pr_mode: true`, `pr_size_policy: fat`)
Next step: iter-022 — **P5.E (multi-currency)** as the Phase 5 closer.
  v1 lean: single user-pref currency (no per-expense override), ISO
  4217 allowlist (USD/EUR/GBP/JPY), localStorage-backed preference hook
  (mirror `theme.ts`). Touches `src/lib/expense.ts` (optional
  `currency?: string`), `src/lib/currency.ts` (expand formatUSD to
  format(amount, currency)), `src/lib/csv.ts` (column), `src/lib/backup.ts`
  (schemaVersion 2→3), all the components consuming `formatUSD`
  (RunningTotal, MonthlySummary, SpendingByCategory, etc.).
  After P5.E ships, Phase 5 closes and **iter-023 MUST run the
  mandatory phase-boundary arch pass** before Phase 6 — hard rule from
  loop protocol.
Open first: `GOALS.md` (P5.E), `src/lib/expense.ts` (the new optional
  field), `src/lib/currency.ts` (the formatter to expand),
  `src/lib/theme.ts` (mirror its localStorage seam),
  `src/lib/backup.ts` (schema version bump),
  `src/components/RunningTotal.tsx` (representative formatUSD consumer).
Open blocks: none open — see `logs/blocks.md` for iter-021 super-
  reviewer notes (APPROVE high confidence; categoryBudgetId is the
  sole composite-format site, STORES tuple covers all 5 stores
  atomically).
Carry-forward: TD.6 (category-deletion cascade); TD.9 (makeStore
  factory — sequencing constraint cleared, not yet picked); TD.10
  (expenseVisibility.ts); TD.11 (drop vestigial Expense.recurring);
  TD.12 (useStoredCollection refresh-after-mutation error isolation);
  deferred `useSpendingByCategory` typing pair-up; P3.D chart text
  aria-hidden; centralise localStorage test shim (P5.E currency-pref
  hook may be the 2nd consumer that triggers this); DateRangeFilter
  from>to normalize; CSV-injection prefix-escape; empty-state
  trailing-period normalize; P4.G follow-up: spinner covers insights;
  CSV export/import of recurring templates; Blob-revoke race in
  Export/BackupExport; filename-vs-exportedAt timezone skew.
Test gate: 496 tests pass; `npm run build` + `npm run lint` clean.
Push: n/a — pr_mode, all work merged via PRs.

Last-iter shipped:
- P5.D (#54): `src/lib/categoryBudget.{ts,test.ts}` (composite-id
  factory + validator); `src/db/categoryBudgetStore.{ts,test.ts}` (put
  upsert keyed by composite); `src/hooks/useCategoryBudgets.{ts,test.ts}`
  (binds into useStoredCollection); `src/components/CategoryBudgetManager.{tsx,test.tsx,css}`
  (per-row UI). DB v4→v5 + migration test extended. Backup
  schemaVersion bumped 1→2; BackupSnapshot + parseBackup +
  restoreBackup + BackupExport carry the new entity. App.tsx wires
  useCategoryBudgets + new section. +45 tests.

Operational notes for iter-022:
  - **DB version is now 5**. P5.E may NOT need a DB bump (currency is
    type-level addition to Expense; IDB is schema-less). If it does
    (e.g. preference table in IDB instead of localStorage), bump to 6
    and extend dbMigration.test.ts.
  - **Backup schemaVersion is now 2**. P5.E may bump to 3 if currency
    info needs to round-trip (e.g. per-expense currency stored on
    each Expense — yes, but that's already implicit if the field
    lands on Expense). Lean: bump to 3 if any new behavior depends
    on it.
  - **`useStoredCollection` is the seam** for new collection-shaped
    domains. Currency pref is a single value, not a collection — use
    a simple `useCurrency` hook mirroring `useTheme` / `theme.ts`
    pattern (load + setter + first-paint sync).
  - **Cadence:** 600s (impl iter).
  - **Process-fix held**: explicit-path staging on every commit.
    Ten-iter streak.
  - `vite.config.ts` `fileParallelism: false` still load-bearing.
  - **App.test hash-reset pattern (iter-019)** still load-bearing.
  - **TD.9 (makeStore factory)** has now had 3 iters of stability on
    the new hook seam — sequencing constraint cleared. Available for
    iter-023+ if not picked up sooner.

Open questions for iter-022 (P5.E):
  (1) Single-currency app vs per-expense currency? Lean: single user-
      pref currency for v1 (per-expense without conversion rates would
      mislead totals).
  (2) Default — USD or unset? Lean USD default (matches current
      hard-coded behavior).
  (3) ISO 4217 allowlist — USD/EUR/GBP/JPY for v1? Lean yes;
      extensible.
  (4) Preference storage — localStorage (sync, first-paint, matches
      theme.ts) vs IndexedDB (consistent with the rest of the data
      layer)? Lean localStorage. Centralise localStorage test shim if
      this lands.
