# iter-021

**Phase:** Phase 5 — Power-user persistence & data control · **Mode:**
single-feature · **pr_mode:** true

## Feature landed

- **P5.D (PR #54)** — per-category budgets. New `CategoryBudget` domain
  keyed by composite STRING id `${month}|${categoryId}`. Binds into
  `useStoredCollection` from TD.7 with a frozen `categoryBudgetMessages`
  bundle. New `<CategoryBudgetManager>` section in App.tsx mirroring
  the `<RecurringManager>` pattern. **Independent** from
  `monthlyBudgets` for v1 — no coupling.

Bundled changes (forced by the new domain):
- DB v4 → v5 (`categoryBudgets` appended to `STORES`; existing upgrade
  loop creates the new store).
- `dbMigration.test.ts` v4 → v5 case added.
- Backup `BACKUP_SCHEMA_VERSION` bumped 1 → 2. `BackupSnapshot` gains
  `categoryBudgets` array. `parseBackup` validates the new field +
  rejects v1 snapshots with `unsupported-schema-version`.
  `restoreBackup` STORES tuple grows 4 → 5 stores (atomic tx covers
  the new domain; rollback test extended). `<BackupExport>` carries
  the new array. `<BackupRestore>` confirmation copy lists per-category
  budgets.

Final gate: **496 tests pass** (451 → 496, +45), tsc + lint + build
clean (233.72 kB JS / gzip 71.03).

## How it went

- Single Class B sub-agent. Allowlist deliberately permissive (9 new
  files + edits to db.ts, dbMigration.test.ts, errorMessages.ts,
  backup.ts, parseBackup.ts, restoreBackup.ts, BackupExport.tsx,
  BackupRestore.tsx, App.tsx — every backup-path file because the
  schema bump cascades).
- Process-fix held — explicit-path staging on every commit. Ten-iter
  streak.
- CodeRabbit: 1 MAJOR finding applied (`categoryId` normalization: trim
  once for both id derivation AND stored field; whitespace variants
  used to collapse only via the trim guard but not in the row).
- Super-reviewer APPROVE high confidence: grep confirms
  `categoryBudgetId` is the ONLY composite-format site;
  `setCategoryBudget` is `put` (upsert) not `add`; STORES tuple
  covers all 5 stores; backup schemaVersion v1 → 2 rejection is
  explicit (not silent-pass).

## Decisions / notes

- **Composite STRING id** (`${month}|${categoryId}`) — chosen over
  IDB tuple-key path for consistency with `monthlyBudgets` (keyed by
  `month`) and simpler lookups. `categoryBudgetId()` is the SOLE site
  that builds the format — one-file change should the separator move.
- **`categoryId` normalization** (CR fix) — trim once, use for both
  id derivation and stored field. Prevents same-logical-category
  whitespace variants from creating two rows.
- **Independent from `monthlyBudgets`** — v1 keeps them decoupled.
  Sum-coupling is harder (which budget "wins" when both are set?
  surface the discrepancy how?) and pushes UI design decisions
  ahead of usage signal. Revisit in v2 if users want it.
- **Backup `BACKUP_SCHEMA_VERSION` 1 → 2 is breaking by design.** Old
  snapshots from iter-019/020 now refuse on restore with
  `unsupported-schema-version`. Alternative (silent-load with
  `categoryBudgets: []`) would let users restore v1 backups and silently
  lose any per-category budgets they didn't realize would drop —
  worse UX. The 3-error-reason contract in `parseBackup` was built
  for this.
- **Confirmation dialog copy** in `<BackupRestore>` enumerates the
  new entity. Sub-agent flagged it as a follow-up; ran the small fix
  before merging.

## Wake-up handoff

- **Current phase:** Phase 5 (4 of 5 features done: P5.A, P5.B, P5.C,
  P5.D). Remaining: **P5.E (multi-currency)** — defer to last;
  broad schema impact (`currency?: string` on Expense, format helpers,
  CSV column, backup schema bump v2 → v3, display preference hook).
- **Next step:** iter-022 — pick between (a) **P5.E (multi-currency)**
  as the Phase 5 closer, or (b) **TD.9 (`makeStore<T>` factory)** as a
  refactor follow-up to TD.7 (TD.9 was queued in iter-017 arch pass
  "post-iter-018" and has now had 3 iters of stability on the new hook
  seam). Lean: (a) — close Phase 5 first; the TD.9 sequencing
  constraint has long since cleared. P5.E ships, then Phase 6 begins
  with an arch pass per the hard rule. Both options are equally
  scoped (~1 iter each); the user's product priorities tip it.
- **Files to open first (P5.E path):** `src/lib/expense.ts` (add
  optional `currency?: string`), `src/lib/csv.ts` (column),
  `src/lib/backup.ts` (schemaVersion bump 2 → 3), `src/lib/currency.ts`
  (currently a formatUSD helper; expand to multi-currency),
  `src/components/RunningTotal.tsx` / `<MonthlySummary>` /
  `<SpendingByCategory>` (all consume `formatUSD`).
- **Open questions (P5.E):** (1) Default currency — USD or
  user-configurable via a `useCurrency` preference hook? Lean
  configurable. (2) Per-expense override vs single-currency app?
  Lean single-currency (per-expense currency without conversion
  rates is misleading in totals; multi-currency *with* conversion is
  a large feature). For v1: single user-pref currency, no per-expense
  override. (3) ISO 4217 vs free-form? Lean ISO codes (validate
  against a small allowlist; USD/EUR/GBP/JPY suffices for v1).
  (4) Where does the preference live — localStorage (matches dark
  mode) or IndexedDB? Lean localStorage (synchronous, first-paint
  ready, matches `theme.ts`).
- **Carry-forward:** TD.6 (category-deletion cascade — product
  decision pending); TD.9 (makeStore factory — sequencing constraint
  cleared but not yet picked); TD.10 (expenseVisibility.ts —
  deferred); TD.11 (drop vestigial Expense.recurring — deferred);
  TD.12 (useStoredCollection refresh-after-mutation error isolation);
  deferred `useSpendingByCategory` typing pair-up; P3.D chart text
  aria-hidden; centralise localStorage test shim (P5.E theme-pref
  hook may be the 2nd consumer that triggers this); DateRangeFilter
  from>to normalize; CSV-injection prefix-escape; empty-state
  trailing-period normalize; P4.G follow-up: spinner covers insights;
  CSV export/import of recurring templates; Blob-revoke race in
  Export/BackupExport; filename-vs-exportedAt timezone skew.
- **Scheduled:** 600s (impl iter — P5.E is concrete with established
  mirror patterns from P5.A/D and `theme.ts`).
