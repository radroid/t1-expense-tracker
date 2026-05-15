# iter-020

**Phase:** Phase 5 — Power-user persistence & data control · **Mode:**
single-feature · **pr_mode:** true

## Feature landed

- **P5.C (PR #52)** — JSON backup restore. Inverse of P5.B's export.
  Three-layer seam: `parseBackup` (pure shape validation with three
  typed error reasons), `restoreBackup` (atomic multi-store IDB
  transaction), `<BackupRestore>` (file picker + native `<dialog>` +
  inline alert/status semantics). App.tsx fans out
  `Promise.allSettled` over the four hooks' `refresh()` after the DB
  write commits.

Final gate: **451 tests pass** (433 → 451, +18), tsc + lint + build
clean (230.06 kB JS / gzip 70.34).

## How it went

- Single Class B sub-agent. Allowlist covered 7 new files + 6 edits
  (App.tsx + App.test.tsx + 4 hook passthroughs). Process-fix held —
  explicit-path staging. Nine-iter streak.
- CodeRabbit: 3 findings, all applied (Promise.allSettled over hook
  refreshes, STORES double-cast → `[...STORES]`, redundant test
  assertion).
- Super-reviewer APPROVE high confidence. Verified atomicity (single
  tx, no await between requests), rollback test exercises real
  `tx.abort()` path, jsdom fallback feature-detected at call site
  rather than monkey-patched.

## Decisions / notes

- **Atomic full-replace, not merge.** Restore policy v1: clear + add
  for all four stores inside ONE `db.transaction([...STORES],
  'readwrite')`. Merge policy is harder (id collisions across snapshot
  vs current) — deferred. The DB write either fully succeeds or fully
  aborts via `tx.abort()`.
- **No await between requests in the tx executor** — that would let
  the tx auto-commit between writes and lose later operations. All
  `clear()` + `add()` calls are synchronous; the await is pinned to
  the tx's `oncomplete` / `onerror` / `onabort` promise.
- **`Promise.allSettled` for the hook refresh fan-out**, not
  `Promise.all`. The DB write already committed by the time
  `onRestore` fires — a transient hook-refresh failure is a UI-sync
  miss, not data loss. Was `Promise.all` before CR triage.
- **Native `<dialog>` with feature-detected jsdom fallback.** jsdom 29
  lacks `HTMLDialogElement.showModal/.close` — production uses the
  real methods (free a11y, focus trap, ESC-closes, `::backdrop`); the
  test path falls back to toggling the `open` attribute. Tests assert
  via `hasAttribute('open')` for parity. Logged the jsdom limitation
  in the component comments so it's not surprising in 12 iters.
- **Hook `refresh()` passthrough = justified scope creep.** Sub-agent
  added one-line type+destructure additions to the four wrapper hooks
  to expose the `useStoredCollection` escape hatch (already there
  since iter-018). The spec contract explicitly required
  `expensesHook.refresh()` etc. in App.tsx. Behavior of existing call
  sites unchanged; existing hook tests stay green untouched.

## Wake-up handoff

- **Current phase:** Phase 5 (3 of 5 features done: P5.A, P5.B, P5.C).
  Remaining: **P5.D (per-category budgets)** — larger; needs UI design
  for the per-category progress strip + composite-key store. **P5.E
  (multi-currency)** — defer to last (broad schema impact).
- **Next step:** iter-021 — **P5.D (per-category budgets)** as a
  single-feature impl iter (likely fat candidate scope if a small
  companion item shows up). Vertical slice: new `categoryBudgets`
  store keyed on `${month}|${categoryId}` (or a composite key path);
  `src/lib/categoryBudget.ts` factory; `useCategoryBudgets` hook
  (binds into `useStoredCollection` seam from TD.7); UI section under
  the existing `<BudgetForm>` or a new tab. The progress strip in
  `<BudgetVsActual>` either splits per-category or stays month-total
  with a new sibling view — design call.
- **Files to open first:** `GOALS.md` (P5.D), `src/lib/budget.ts` +
  `src/hooks/useMonthlyBudgets.ts` (reference shape — the new
  per-category hook mirrors this), `src/components/BudgetVsActual.tsx`
  + `src/components/BudgetForm.tsx` (UI dependencies), `src/db/db.ts`
  (DB v4 → v5 bump for the new store), `src/db/dbMigration.test.ts`
  (extend the migration test as iter-016 did).
- **Open questions:** (1) Composite key path — `${month}|${categoryId}`
  string OR `[month, categoryId]` tuple key path? Lean: string
  (consistent with monthlyBudgets keyed by `month`; simpler IDB lookup
  path; one less indirection in tests). (2) UI placement — a new
  `<CategoryBudgetManager>` section OR add a per-category strip to the
  existing `<BudgetVsActual>`? Lean: new section, mirror the
  `<RecurringManager>` pattern. (3) Behavior when a per-category
  budget exists AND a month-total budget exists — sum the per-category
  (preferred) OR keep them independent reads with two progress strips?
  Lean: independent for v1 (no implicit "month total = sum of per-
  category" coupling); revisit in v2 if users want it.
- **Carry-forward:** TD.6 (category-deletion cascade); TD.9 (makeStore
  factory); TD.10 (expenseVisibility.ts); TD.11 (drop vestigial
  Expense.recurring); TD.12 (useStoredCollection refresh-after-
  mutation); deferred `useSpendingByCategory` typing pair-up; P3.D
  chart text aria-hidden follow-up; centralise localStorage test
  shim; DateRangeFilter from>to normalize; CSV-injection prefix-
  escape; empty-state trailing-period normalize; P4.G follow-up
  loading-covers-insights; CSV export/import of recurring templates;
  Blob-revoke race in Export/BackupExport; filename-vs-exportedAt
  timezone skew.
- **Scheduled:** 600s (impl iter — P5.D is concrete vertical slice
  with established mirror patterns).
