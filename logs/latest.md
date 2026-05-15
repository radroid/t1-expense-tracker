# Latest

Latest: iter-026 — **P6.A (recurring CSV export/import) + P6.E
(category-delete cascade) shipped (PR #61).** Fat-iter; two
parallel Class B sub-agents with disjoint allowlists; main-agent
integrated App.tsx. TD.6 closed (block-while-in-use product call).
561 tests pass (+37).

Stage: S3 (Phase 6, 2 of 5 done) — see `.loop/state.json`
  (`pr_mode: true`, `pr_size_policy: fat`)
Next step: iter-027 — **P6.B time-series analytics**. New
  `src/lib/trends.ts` (`summarizeByMonth`); new `<TrendsChart>`
  (pure SVG, parallel to SpendingChart); new `<YearSwitcher>`.
  Year filter narrows visibleExpenses; budget pipeline stays
  month-scoped (P4.B carveout pattern extends).
Open first (for iter-027): `src/components/SpendingChart.tsx`
  (parallel for TrendsChart); `src/components/MonthSwitcher.tsx`
  (parallel for YearSwitcher); `src/hooks/useVisibleExpenses.ts`
  (year-filter wiring); `src/lib/expenseFilter.ts` (filter
  primitives — year filter joins this set); `src/lib/totals.ts`.
Open blocks: none open. iter-026 super-reviewer logged under
  `## iter-026 — super-reviewer (fat-iter: P6.A + P6.E)` with
  APPROVE-WITH-NITS high-confidence. Nit captured as TD.17.

Test gate: 561 tests pass. `npm run build` 239.23 kB / gzip 72.00
  clean. `npm run lint` clean.
Push: PR #61 squash-merged.

Last-iter shipped (PR #61):
- P6.A: new `src/lib/recurringCsv.{ts,test.ts}` (15 specs);
  `useRecurringTemplates.addMany` (+ 4 specs); new
  `<RecurringExport>` + `<RecurringImport>` (8 specs);
  `<RecurringManager>` renders both inline (+ 2 specs).
- P6.E: `categoryMessages.inUse(count)` factory in
  `errorMessages.ts`; `useCategories.setError` exposed
  (domain-pure — no useExpenses dep); `<CategoryManager>`
  optional `getInUseCount` prop + disable/annotation (+ 5
  component specs + 2 hook specs); App.tsx orchestrates the
  count-guard + filter-reset flow.
- App.test.tsx: prior delete-cascade test rewritten to use
  Transport (unused); new P6.E in-use-block test added.

Operational notes for iter-027:
  - **Cadence:** 600s (impl-iter — single feature).
  - **Process-fix held**: explicit-path staging on every commit.
    Thirteen-iter streak. Keep it up.
  - `vite.config.ts` `fileParallelism: false` still load-bearing.
  - **localStorage shim centralised** in `src/test/setup.ts`.
  - **Seams in play:** `store.ts` (IDB), `useStoredCollection`
    (hook), `errorMessages.ts` (messaging), `currency.ts`
    (formatter). P6.B adds NO new seam; introduces a new pure
    lib file (`trends.ts`) and reuses existing component
    patterns.
  - **DB version still 5**, backup `BACKUP_SCHEMA_VERSION`
    still 2 — P6.B is read-only over `useExpenses.expenses`;
    no new IDB store or schema bump expected.
  - **3rd-consumer-rule:** TD.13 (`makeDownloadBlob`) + TD.14
    (`useFileRestoreFlow`) now have 3 consumers each thanks
    to P6.A (`<RecurringExport>` / `<RecurringImport>`). The
    Phase-6 → Phase-7 arch pass should pick them up.

Open questions for iter-027:
  (1) Year-view: derive from in-memory `useExpenses.expenses` vs
      a new DB query? Lean: in-memory.
  (2) TrendsChart x-axis labels: "Jan"/"Feb" (abbreviated) vs
      "2026-01" (numeric)? Lean: abbreviated for clarity.
  (3) YearSwitcher coexist with MonthSwitcher or replace
      contextually? Lean: coexist — mode toggle hides
      MonthSwitcher when in year view.
  (4) Color palette for the trends bars — match SpendingChart's
      category-color scheme, or use a single accent color
      (since trends are about time not category)? Lean: single
      accent.
