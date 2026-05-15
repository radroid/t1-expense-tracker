# iter-024

**Phase:** post-Phase-5 cleanup-week (pre-Phase-6) · **Mode:** single-PR
bundle · **pr_mode:** true

## Features landed

- **TD.9 + TD.11 + TD.16 (PR #59)** — three pure-subtraction items
  from the iter-023 arch pass bundled into one coherent cleanup PR.
  - **TD.9** — `src/db/store.ts` exports `makeStore<T, K>(name)`
    returning `{ add, put, getAll, get, remove }`. Five domain stores
    (expense, category, budget, recurringTemplate, categoryBudget)
    collapsed to thin re-export wrappers (~10 LOC each, was 20-35).
    Domain helpers (`seedDefaultCategories`, `categoryBudgetId`) stay
    in their modules. New `src/db/store.test.ts` exercises 5 specs:
    add+getAll roundtrip, put-as-upsert, get hit+miss, remove,
    add-conflict-throws (verifying IDB `add` vs `put` semantics).
  - **TD.11** — `Expense.recurring?: boolean` dropped from type +
    `ExpenseInput` + `validateExpenseInput` cleaned-shape +
    `applyExpenseEdit` preservation branch. CSV format narrows
    5→4 columns; `parseRecurring` helper deleted.
  - **TD.16** — `formatUSD` shim deleted; pinned test block
    removed; two stale test descriptions renamed.

Final gate: **524 tests pass** (527 → 524: −5 formatUSD tests + 5
new factory tests + −3 dropped recurring tests). `npm run build`
(234.21 kB / gzip 71.33) + `npm run lint` clean.

## How it went

- Direct implementation (no sub-agent dispatch) — the three items are
  mechanical refactors with disjoint surfaces; sub-agent overhead
  exceeded scope. Twelve-iter explicit-path-staging streak held.
- Super-reviewer APPROVE high-confidence. Audited public-API parity
  (TD.9), composite-key safety, forbidden-file (no backup files
  touched), recurring + formatUSD cleanup completeness, CSV format
  shift. No drift from the contracted pure-subtraction shape. Notes
  in `logs/blocks.md` ## iter-024.
- CodeRabbit was rate-limited (paid-plan credits exhausted) and
  posted no findings. Class A super-reviewer is the load-bearing
  signal; status check itself reports `pass`. Auto-merged on green
  checks + APPROVE.

## Decisions / notes

- **TD.15 (backupPipeline.ts barrel) deferred.** Re-export
  rearrangement doesn't concentrate complexity; would have diluted
  the cleanup focus. Reopen when a backup-schema-evolution iter
  lands.
- **`add` vs `put` distinction kept at the factory level.** Both
  are exposed; domain modules pick the right one (e.g. `addExpense`
  uses `add`, `setBudget` uses `put`). Could have collapsed to
  put-only — chose not to so the throw-on-conflict semantic stays
  available for stores that want it. Explicit add-conflict-throws
  test pins the behavior.
- **CSV format change is breaking for any pre-iter-024 CSV file
  with a `recurring` column.** Local-only app, single user, no
  real legacy. Field has been vestigial since iter-016. Accepting
  the break; documented in csv.ts header comment.
- **Net diff: −150 LOC** (16 files, +186/−231 with new factory file
  + 5 new tests partially offsetting).

## Wake-up handoff

- **Current phase:** post-Phase-5 cleanup done; Phase 6 themes
  triage next.
- **Next step:** iter-025 — Phase 6 PLANNING iter. Concrete items
  TBD; the iter-022 handoff listed candidate themes:
  - **per-expense currency with conversion rates** (would need
    external FX dependency — biggest scope)
  - **analytics polish** (trends over time, year view) — extends
    SpendingChart + MonthlySummary
  - **recurring-template CSV export/import** — extends csv.ts
    pipeline
  - **accessibility audit** (a11y) — touches every component
  - **performance pass** (Lighthouse, bundle splitting) — config +
    measurement work
  iter-025 reads the iter-017 arch-pass output for the pattern of
  triaging Phase-N themes, picks 3-5 P6 items, and writes them
  into GOALS.md as `P6.A`...`P6.E`.
- **Cadence:** 1500s (plan-iter — Phase 6 triage is thinking work).
- **Files to open first for iter-025:** `GOALS.md` Phase 6 stub
  (currently the placeholder); `logs/iter-017.md` (the previous
  phase-boundary planning-iter); `logs/blocks.md` ## iter-023 +
  ## iter-024 sections; the iter-022 handoff in
  `logs/iter-022.md` "Phase 6 themes (placeholder)" section.
- **Carry-forward (full list):** TD.6 (category-deletion cascade —
  product decision pending); TD.10 (expenseVisibility pipeline —
  still no non-React consumer); TD.12 (useStoredCollection
  refresh-after-mutation — preserve until a real symptom surfaces);
  TD.13 (`makeDownloadBlob` — defer until 3rd consumer); TD.14
  (`useFileRestoreFlow` — defer until 3rd consumer); TD.15
  (`backupPipeline.ts` barrel — defer to schema-evolution iter);
  deferred `useSpendingByCategory` typing pair-up; P3.D chart text
  aria-hidden; DateRangeFilter from>to normalize; CSV-injection
  prefix-escape; empty-state trailing-period normalize; P4.G
  follow-up; Blob-revoke race in Export/BackupExport;
  filename-vs-exportedAt timezone skew.
