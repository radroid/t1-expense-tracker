# Latest

Latest: iter-019 — P5.A (URL filter persistence) + P5.B (JSON backup
export) shipped together (PR #50). First Phase 5 features done.

Stage: S3 (Phase 5 in flight — 2/5 features done) — see `.loop/state.json`
  (`pr_mode: true`, `pr_size_policy: fat`)
Next step: iter-020 — single-feature impl iter for **P5.C (JSON backup
  restore)**. Adds `<BackupRestore>` (file picker + confirmation modal
  + schemaVersion check) and a `restoreBackup(snapshot)` cross-store
  routine (likely `src/db/restoreBackup.ts` — cross-store DB op, not
  pure lib). v1 policy: full-replace (clear + bulk-add for all four
  stores in a single IDB transaction). Merge policy deferred.
Open first: `GOALS.md` (Phase 5 section — P5.C still open); `src/lib/backup.ts`
  (the `BackupSnapshot` shape P5.C consumes); `src/components/BackupExport.tsx`
  (Blob-download mirror; restore will inverse via FileReader);
  `src/db/{expense,category,budget,recurringTemplate}Store.ts` (the
  four stores that need clear + bulk-add); `src/db/db.ts`
  (`withStore` is single-store; multi-store transactions may need a
  small `withStores(names, mode, fn)` helper).
Open blocks: none open — see `logs/blocks.md` for iter-019 super-reviewer
  notes (APPROVE high confidence; CR's MAJOR replaceState-with-space
  fix was applied during triage, not at super-review).
Carry-forward: TD.6 (category-deletion cascade — product decision
  pending); TD.9 (makeStore factory — sequenced after the new hook
  seam stabilizes); TD.10 (expenseVisibility.ts — deferred); TD.11
  (drop vestigial Expense.recurring — deferred); TD.12
  (useStoredCollection refresh-after-mutation error isolation);
  deferred `useSpendingByCategory` typing pair-up; P3.D chart text
  aria-hidden follow-up; centralise localStorage test shim;
  DateRangeFilter from>to normalize (low priority); CSV-injection
  prefix-escape on export (low priority); empty-state trailing-period
  normalize; P4.G follow-up: spinner covers insights section; CSV
  export/import of recurring templates; **Blob-revoke race in
  Export/BackupExport** (declined CR nit, logged iter-019);
  **filename-vs-exportedAt timezone skew** in BackupExport (1-day
  skew possible near midnight UTC; cosmetic).
Test gate: 433 tests pass; `npm run build` + `npm run lint` clean.
Push: n/a — pr_mode, all work merged via PRs.

Last-iter shipped:
- P5.A + P5.B (#50): `src/lib/urlFilters.{ts,test.ts}` (pure URLSearchParams
  parse/serialize); `src/lib/backup.{ts,test.ts}` (BackupSnapshot +
  buildBackup + formatBackup, schemaVersion=1, injectable now);
  `src/components/BackupExport.{tsx,test.tsx,css}` (Blob download);
  `src/App.tsx` (lazy-init filters from hash + write-back effect; wires
  BackupExport into .app__csv row); `src/App.test.tsx` (hash reset in
  beforeEach + 3 integration tests). +45 tests (30 urlFilters + 12
  backup + 3 App).

Operational notes for iter-020:
  - **P5.C is destructive** — clear all four stores then bulk-add from
    the snapshot. UI confirmation modal is non-negotiable. Use the
    schemaVersion check to refuse unsupported shapes loudly (alert,
    not silent).
  - **Multi-store IDB transaction**: `withStore` is single-store. For
    P5.C, a `withStores(names: string[], mode, fn)` helper in
    `src/db/db.ts` is reasonable — or use a one-shot
    `db.transaction(allStoreNames, 'readwrite')` in `restoreBackup.ts`
    directly without going through `withStore`.
  - **Cadence:** 600s (impl iter).
  - **Process-fix held**: explicit-path staging on every commit.
    Eight-iter streak.
  - `vite.config.ts` `fileParallelism: false` still load-bearing.
  - **App.test hash-reset pattern is now load-bearing** — every new
    test added must inherit the beforeEach reset, or assert hash
    explicitly. P5.A introduces the persistence; P5.C will rely on
    the same reset.

Open questions for iter-020 (P5.C):
  (1) Atomicity — wrap clear+bulk-add of all four stores in one
      multi-store IDB transaction (yes, lean) vs sequential per-store
      (simpler but partial-failure risk)? Lean: single transaction.
  (2) Confirmation UI — `<dialog>` element vs custom modal div? Lean
      native `<dialog>` (a11y comes free).
  (3) Where does restoreBackup live? Lean: `src/db/restoreBackup.ts`
      (DB op, not pure lib).
  (4) Schema version mismatch — alert + abort, or auto-migrate? Lean:
      alert + abort for v1; migration story is future work.
