# iter-019

**Phase:** Phase 5 — Power-user persistence & data control · **Mode:**
fat-iter (2 features, 1 combined PR — shared App.tsx integration) ·
**pr_mode:** true

## Features landed

- **P5.A (PR #50)** — URL filter persistence. `src/lib/urlFilters.ts`
  pure parse/serialize over URLSearchParams (stable key order:
  month, cat, q, from, to; silent-drop on invalid month/date).
  App.tsx lazy-inits filter state from the hash + `useEffect`
  writes via `history.replaceState`. Bookmarkable filtered views;
  refresh-safe.
- **P5.B (PR #50)** — JSON backup export. `src/lib/backup.ts` builds
  a versioned `BackupSnapshot` (`schemaVersion: 1`, ISO `exportedAt`,
  four entity arrays). `<BackupExport>` triggers a Blob download
  `backup-YYYY-MM-DD.json`. Empty data is a valid snapshot.

Final gate: **433 tests pass** (388 → 433, +45), tsc + lint + build
clean (225.53 kB JS / gzip 69.14).

## How it went

- Parallel Class B dispatch (P5.A + P5.B), disjoint lib-level allowlists.
  Main agent (me) integrated both into App.tsx — shared `src/App.tsx` +
  `src/App.test.tsx` made a single combined PR cleaner than splitting.
  This is fat-iter mode working as designed.
- Process-fix held — explicit-path staging on every commit. Eight-iter
  streak.
- CodeRabbit: 5 findings (4 applied, 1 declined for cross-component
  consistency).
- Super-reviewer APPROVE high confidence. Verified round-trip purity,
  lazy-init pattern, replaceState fix from CR triage, no rollover-effect
  infinite loop risk from month-change in hash, snapshot key order
  determinism, BackupExport mirroring ExportButton's Blob pattern.

## Decisions / notes

- **`replaceState`, not `pushState`** for hash writes — typing into
  SearchBox shouldn't pollute the browser back stack with a history
  entry per keystroke. Tested.
- **Clear target is `location.pathname + location.search`** when the
  serialized hash is empty (CR fix). Earlier revision used a literal
  space, which jsdom accepted but would have left `" "` in a real URL
  bar.
- **Hash reset in App.test beforeEach** — jsdom's `window.location`
  outlives a single test. Without resetting, P5.A persistence leaks
  state across tests. 6 unrelated tests failed before adding the
  reset.
- **Snapshot schemaVersion + ISO exportedAt** are the durable seam
  for P5.C restore. The current `formatBackup` uses object insertion
  order (ECMA spec preserves it for string keys) for key stability;
  restore can rely on `JSON.parse` returning the same shape.
- **BackupExport filename uses local-time YYYY-MM-DD** while
  `exportedAt` is UTC ISO. Possible 1-day skew near midnight UTC for
  users in negative timezones. Cosmetic — filename, not authoritative.
- **Declined CR nit** on `URL.revokeObjectURL` race — ExportButton.tsx
  (P4.C) uses the same immediate-revoke pattern; keep both consistent.
  Track as carry-forward if a real-world race surfaces.

## Wake-up handoff

- **Current phase:** Phase 5 (2 features landed: P5.A, P5.B). Remaining:
  **P5.C (JSON backup restore)** — the natural follow-up; restore the
  snapshot P5.B produces, with a confirmation modal and schemaVersion
  refusal for unsupported shapes. **P5.D (per-category budgets)** —
  larger; designs to consider. **P5.E (multi-currency)** — defer.
- **Next step:** iter-020 — single-feature impl iter for **P5.C (JSON
  backup restore)**. Adds a `<BackupRestore>` component next to
  `<BackupExport>` (file picker + confirmation modal + schemaVersion
  check). Restore policy: full-replace for v1 (replaces all four
  stores in a single transaction, or as close to atomic as IndexedDB
  allows). Merge policy is harder (id collisions across snapshot vs
  current) — defer.
- **Files to open first:** `GOALS.md` Phase 5 section, `src/lib/backup.ts`
  (schema), `src/components/BackupExport.tsx` (Blob/download mirror), the
  four `*Store.ts` files (clear + bulk-add). New shape: a
  `restoreBackup(snapshot)` cross-store routine — may live in
  `src/lib/backup.ts` or a sibling `src/db/restoreBackup.ts`.
- **Open questions:** (1) Atomicity — IDB supports multi-store transactions
  within a single tx; can we wrap clear+bulk-add for all four stores in
  one? Lean: yes (it's local-only, one db). (2) UI confirmation — modal
  or inline `<details>`? Lean modal — destructive op deserves friction.
  (3) Where does `restoreBackup` live? Lean: `src/db/restoreBackup.ts`
  (it's a cross-store DB op, not pure lib logic).
- **Carry-forward:** TD.6 (category-deletion cascade — product
  decision pending); TD.9 (makeStore factory — sequenced after the new
  hook seam stabilizes); TD.10 (expenseVisibility.ts — deferred);
  TD.11 (drop vestigial Expense.recurring — deferred); TD.12
  (useStoredCollection refresh-after-mutation error isolation —
  iter-018 log); deferred `useSpendingByCategory` typing pair-up; P3.D
  chart `<text>` aria-hidden follow-up; centralise localStorage test
  shim; DateRangeFilter `from>to` normalize; CSV-injection
  prefix-escape; empty-state trailing-period normalize; P4.G follow-up
  loading-covers-insights; CSV export/import of recurring templates;
  Blob-revoke race in Export/BackupExport (logged iter-019);
  filename-vs-exportedAt timezone skew (logged iter-019).
- **Scheduled:** 600s (impl iter — P5.C is concrete; UI surface +
  cross-store transaction with the existing snapshot shape).
