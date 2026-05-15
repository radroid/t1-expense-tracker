# iter-029

**Phase:** Phase 6 (FINAL ITER) · **Mode:** single-feature
· **pr_mode:** true

## Features landed (PR #64)

- **P6.D** — Performance / bundle pass. Three rare-use management
  surfaces (`CategoryManager`, `RecurringManager`, `BackupRestore`)
  converted to `React.lazy()` with per-component
  `<Suspense fallback={<Spinner size="sm" />}>` boundaries sitting
  INSIDE the existing `!loading` branch (a11y-012 preserved). The
  `lazy()` adapter uses `.then((m) => ({ default: m.X }))` because
  all three components are named exports.

### Bundle measurements

| | Before (iter-028) | After (iter-029) | Δ |
|---|---|---|---|
| Main JS (raw) | 242.80 kB | 231.67 kB | **−11.13 kB** |
| Main JS (gzip) | 72.92 kB | 71.37 kB | **−1.55 kB** |
| Main CSS (raw) | 26.74 kB | 21.40 kB | **−5.34 kB** |
| Main CSS (gzip) | 4.38 kB | 3.84 kB | **−0.54 kB** |

Three new on-demand chunks:
- RecurringManager 6.43/2.25 kB JS + 2.44/0.73 kB CSS
- BackupRestore 4.80/1.67 kB JS + 1.81/0.62 kB CSS
- CategoryManager 2.23/0.85 kB JS + 1.08/0.43 kB CSS

The biggest single saving: `parseBackup` + `db/restoreBackup`
move out of the main chunk because only `BackupRestore` imports
them.

Final gate: **588 tests pass** (unchanged from iter-028; RTL
`findBy*` handles the async lazy resolve transparently). Build
clean. Lint clean.

## How it went

- Direct main-agent implementation (no sub-agent dispatch). Scope
  was concrete and well-defined; sub-agent overhead would have
  exceeded the work.
- Class A super-reviewer APPROVE high-confidence. Verified all
  three lazy boundaries sit inside `!loading` (a11y-012
  preserved), no cross-chunk duplication of helpers, no
  forbidden-file touches.
- CodeRabbit: zero inline findings.
- Process-fix held: explicit-path staging on every commit.
  Sixteen-iter streak.

## Decisions / notes

- **`React.memo` / `useMemo` for aggregations deliberately
  deferred.** Handoff: skip pending profiler evidence; React 19
  compiler not enabled. If a perf hotspot surfaces in a future
  audit, revisit.
- **No Vite config changes.** `lazy()` boundaries alone produce
  the chunk split cleanly. `vite.config.ts fileParallelism:
  false` test-stability constraint remains untouched.
- **Per-component Suspense (not grouped).** If one chunk is slow,
  only its section shows the spinner; rest of the page stays
  interactive.

## Phase 6 closed

All 5 Phase 6 items shipped:
- P6.A (#61): recurring CSV export/import
- P6.B (#62): time-series analytics + year view
- P6.C (#63): a11y audit P0 cluster (14 fixes)
- P6.D (#64): perf/bundle pass via React.lazy split
- P6.E (#61): category-deletion cascade (block-while-in-use,
  closed TD.6)

iter-030 MUST run the **mandatory phase-boundary architecture
pass** (`improve-codebase-architecture` skill invocation) before
any Phase 7 feature work. Hard rule.

## Wake-up handoff

- **Current phase:** Phase 6 CLOSED.
- **Next step:** iter-030 — **mandatory arch pass** (invoke
  `improve-codebase-architecture` skill as the very first
  action; log result to `logs/blocks.md` with
  `**Source:** arch-pass`). The pattern matches iter-017
  (P4 → P5) and iter-023 (P5 → P6).
- **Files to open first (for arch-pass context):** `GOALS.md`
  (Phase 7 stub TBD — currently empty; arch pass produces it);
  `logs/iter-023.md` (the previous phase-boundary arch pass);
  `logs/blocks.md` ## iter-023 + ## iter-028 + ## iter-029
  sections. The audit-first pattern from iter-028's a11y pass
  worked very well — consider applying it to the arch pass
  too.
- **Candidates already on TD radar that the iter-030 arch pass
  should consider:**
  - **TD.13 (`makeDownloadBlob`)** — 3rd-consumer-rule MET as
    of iter-026 (RecurringExport). Strong pickup candidate.
  - **TD.14 (`useFileRestoreFlow`)** — 3rd-consumer-rule MET as
    of iter-026 (RecurringImport). Strong pickup candidate.
  - **TD.15 (backupPipeline barrel)** — still no evolution
    pressure on the backup schema; defer or pick if scope.
  - **TD.18 (form-error-association sweep)** — coherent
    independent sweep (5 forms); good pickup candidate.
  - **TD.10 (expenseVisibility pipeline)** — recheck whether a
    non-React consumer surfaced.
  - **TD.17 (App.handleDeleteCategory test gap)** — small
    coverage item.
  - CSV tokenizer duplication between `csv.ts` and
    `recurringCsv.ts` — flagged as future lift; arch pass may
    pick.
- **Cadence:** 1500s (plan-iter — arch pass is thinking work).
- **Carry-forward (full):** TD.6 closed; TD.10 (expenseVisibility
  pipeline); TD.12 (refresh-after-mutation isolation); TD.13
  (3rd-consumer met — pick at arch pass); TD.14 (3rd-consumer
  met — pick at arch pass); TD.15 (backupPipeline barrel); TD.17
  (App guard test gap); TD.18 (form-error-association); TD.19
  (a11y skip-link); TD.20 (a11y persistent error live region);
  deferred `useSpendingByCategory` typing pair-up;
  DateRangeFilter from>to normalize; CSV-injection prefix-escape
  (both CSVs); Blob-revoke race in
  Export/BackupExport/RecurringExport (3 consumers now);
  filename-vs-exportedAt timezone skew.
