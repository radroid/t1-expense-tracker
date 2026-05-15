# iter-026

**Phase:** Phase 6 (in progress) · **Mode:** fat-iter (2 features)
· **pr_mode:** true

## Features landed (PR #61)

- **P6.A** — Recurring-template CSV export/import. New
  `src/lib/recurringCsv.ts` (`formatTemplatesCsv` +
  `parseTemplatesCsv`); `useRecurringTemplates.addMany`; new
  `<RecurringExport>` + `<RecurringImport>` components;
  `<RecurringManager>` renders them inline. CSV columns:
  `description,amount,dayOfMonth,categoryId` (frequency excluded —
  always `'monthly'` today). Creates the 3rd consumer for the
  deferred TD.13 / TD.14 arch seams.
- **P6.E** — Category-deletion cascade UX (block-while-in-use;
  closes TD.6). `categoryMessages.inUse(count)` factory;
  `useCategories.setError` exposed; `<CategoryManager>` disables
  Delete + shows "· N expense(s)" annotation; `App.tsx`
  orchestrates the guard. Defense-in-depth at three layers.

Final gate: **561 tests pass** (524 → 561, +37: +27 P6.A + +9 P6.E
+ +2 App tests rewritten/added). `npm run build` 239.23 kB /
gzip 72.00 kB clean. `npm run lint` clean.

## How it went

- Two parallel Class B sub-agents with disjoint allowlists. App.tsx
  reserved for main-agent integration — avoided contention. Each
  sub-agent returned green test results from their own scope.
- Main-agent integration: 3 small edits to App.tsx (categoryMessages
  import, handleDeleteCategory guard, two new props). One failing
  test (`App.test.tsx` "resets filter when filtered-on category
  deleted") — rewritten to use an unused category (Transport) since
  in-use categories can no longer be deleted under P6.E. Added a
  new P6.E test for the in-use block.
- Class A super-reviewer: APPROVE-WITH-NITS, high confidence.
  Cross-feature integration clean; one nit captured as TD.17.
- CodeRabbit: zero inline findings; review passed.
- Process-fix held: explicit-path staging on every commit.
  Thirteen-iter streak.

## Decisions / notes

- **CSV tokenizer duplication acknowledged.** `recurringCsv.ts`
  duplicates the RFC-4180 state machine from `csv.ts` rather than
  lifting it. Acknowledged in-code; lift becomes a future TD when
  a 3rd CSV consumer (or schema-evolution iter) arrives.
- **`<RecurringExport>` is NOT disabled on empty list.** Header-only
  CSV is intentionally a feature ("starter file" for users to
  populate offline). Documented in component.
- **`onAddMany` defaults to no-op.** Lets `<RecurringManager>` work
  in tests without a stub. App.tsx wiring is verified by the App
  smoke tests; missing wiring would surface as "imported 0" without
  persistence, which the `RecurringManager.test.tsx` smoke spec
  catches at unit level.
- **TD.17 logged** for the App-level guard test coverage gap. Low
  priority — purely test-coverage; the UI disable is the primary
  enforcement.

## Wake-up handoff

- **Current phase:** Phase 6, 2 of 5 items done. iter-027 picks up
  **P6.B (time-series analytics — year view + TrendsChart)**.
- **Next step:** iter-027 — single-feature impl. New
  `src/lib/trends.ts` (`summarizeByMonth(expenses): Array<{month,
  total, count}>` sorted ascending); new `<TrendsChart>` component
  (pure SVG, parallel to `SpendingChart`); new `<YearSwitcher>`
  (year-view filter alongside `MonthSwitcher`). The year filter
  narrows `visibleExpenses`; budget pipeline stays month-scoped
  (P4.B carveout pattern extends naturally).
- **Files to open first for iter-027:**
  `src/components/SpendingChart.tsx` (parallel for TrendsChart shape);
  `src/components/MonthSwitcher.tsx` (parallel for YearSwitcher);
  `src/hooks/useVisibleExpenses.ts` (year-filter wiring);
  `src/lib/expenseFilter.ts` (filter primitives — year filter
  joins this set); `src/lib/totals.ts` (aggregation helpers).
- **Cadence:** 600s (impl-iter — single feature).
- **Carry-forward (full):** TD.6 closed by P6.E; TD.10
  (expenseVisibility — still no non-React consumer); TD.12
  (useStoredCollection refresh-after-mutation — preserve until
  symptom); TD.13 (`makeDownloadBlob` — NOW 3rd-consumer-rule met
  via P6.A; Phase-6 → Phase-7 arch pass should pick up); TD.14
  (`useFileRestoreFlow` — NOW 3rd-consumer-rule met via P6.A;
  arch-pass pickup); TD.15 (backupPipeline barrel); TD.17 (App
  guard test gap — iter-026 nit); deferred
  `useSpendingByCategory` typing pair-up; P3.D chart text
  aria-hidden (folds into P6.C); DateRangeFilter from>to normalize;
  CSV-injection prefix-escape (now applies to BOTH CSVs — fold
  into P6.C or a dedicated security iter); empty-state trailing-
  period normalize; P4.G follow-up; Blob-revoke race in
  Export/BackupExport/RecurringExport — three consumers now;
  filename-vs-exportedAt timezone skew.
- **Open questions for iter-027:**
  (1) Does year-view need its own DB query or can it derive from
      the full expenses list in memory? Lean: in-memory, since
      `useExpenses.expenses` is already the full list.
  (2) TrendsChart: month labels on x-axis — abbreviated ("Jan",
      "Feb") or numeric ("2026-01")? Lean: abbreviated for clarity.
  (3) Should YearSwitcher coexist with MonthSwitcher or replace it
      contextually? Lean: coexist — month-view stays the default,
      year-view is a mode toggle that hides MonthSwitcher.
