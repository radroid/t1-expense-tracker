# Latest

Latest: iter-025 — **Phase 6 planned.** Five P6 items written into
GOALS.md: P6.A (recurring CSV export/import), P6.B (time-series
analytics + year view), P6.C (a11y audit), P6.D (perf/bundle pass),
P6.E (category-deletion cascade UX — TD.6 promote with product
decision made: block-while-in-use). Per-expense FX currency declined
as out-of-charter for this local-only testbed.

Stage: S3 (Phase 6 starting) — see `.loop/state.json`
  (`pr_mode: true`, `pr_size_policy: fat`)
Next step: iter-026 — **fat-iter** shipping P6.A (recurring CSV) +
  P6.E (category-delete cascade). Zero pairwise file overlap; two
  parallel Class B sub-agents.
Open first (for iter-026):
  - P6.A: `src/lib/csv.ts` + `csv.test.ts` (pattern); `src/lib/
    recurring.ts` (RecurringTemplate shape);
    `src/hooks/useRecurringTemplates.ts` (add `addMany`);
    `src/components/RecurringManager.tsx`; new
    `<RecurringExport>` + `<RecurringImport>`.
  - P6.E: `src/hooks/useCategories.ts` (in-use check before
    remove); `src/lib/errorMessages.ts` (add `categoryMessages.inUse`);
    `src/components/CategoryManager.tsx` (delete disable + count);
    App.tsx (predicate wiring if not hook-internal).
Open blocks: none.

Test gate: 524 tests pass (unchanged — thinking iter, no code).
Push: PR #60 (iter-025 planning) — see `gh pr view 60` after merge.

Last-iter shipped: nothing (thinking-iter). Deliverables:
  - `GOALS.md`: Phase 6 section populated with P6.A..P6.E; out-of-
    scope (per-expense FX) explicitly documented; TD.6 status note
    updated to "promotes to P6.E".
  - `logs/iter-025.md` (planning summary + sequencing recommendation).
  - `logs/latest.md` refreshed.
  - `.loop/state.json` bumped to iter 25.

Operational notes for iter-026:
  - **Cadence:** 600s (impl-iter — two concrete features).
  - **Process-fix held**: explicit-path staging on every commit.
    Thirteen-iter streak. Keep it up.
  - `vite.config.ts` `fileParallelism: false` still load-bearing.
  - **localStorage shim centralised** in `src/test/setup.ts`.
  - **Seams in play:** `store.ts` (IDB seam), `useStoredCollection`
    (hook seam), `errorMessages.ts` (messaging seam), `currency.ts`
    (formatter seam). P6.A and P6.E both extend existing seams; no
    new seams expected.
  - **Sub-agent split for iter-026 fat-iter:**
    - Class B #1 (P6.A): owns `src/lib/recurringCsv.{ts,test.ts}` (new);
      `src/hooks/useRecurringTemplates.ts` (+addMany); new
      `src/components/RecurringExport.{tsx,test.tsx,css}` +
      `RecurringImport.{tsx,test.tsx,css}`;
      `src/components/RecurringManager.{tsx,test.tsx}` (wire the
      two new buttons); App.tsx (if RecurringManager call-site
      needs new props).
    - Class B #2 (P6.E): owns `src/hooks/useCategories.{ts,test.ts}`
      (in-use check); `src/lib/errorMessages.ts` (add inUse message
      to categoryMessages); `src/components/CategoryManager.{tsx,
      test.tsx,css}` (disable + count UI). May need a one-line
      App.tsx edit if a predicate is passed in; flag if so.
  - **DB version is 5**, backup `BACKUP_SCHEMA_VERSION` is 2 — both
    untouched by Phase 6 P6.A + P6.E (no new entities; no snapshot
    shape change). P6.B may or may not need a DB bump depending
    on whether trends are derived-on-the-fly vs cached.

Open questions for iter-026:
  (1) `useRecurringTemplates.addMany` shape — mirror
      `useExpenses.addMany` `{added, skipped, errors}`? Lean yes.
  (2) Recurring CSV column set — include `frequency` or assume
      monthly? Today `RecurringTemplate.frequency` is always
      `'monthly'`. Lean: omit until 2nd frequency exists.
  (3) P6.E in-use check — hook-internal vs caller-injected
      predicate? Lean: hook-internal. The hook already wraps
      `useStoredCollection`; adding a pre-mutation guard fits the
      existing pattern. App.tsx wires the expenses array as a dep
      via `useCategories({ expensesUsingCategory: ... })` or
      similar.
  (4) Apply the carry-forward CSV-injection prefix-escape (`=`/`+`/
      `-`/`@`) at csv.ts level so both expense + recurring CSVs
      benefit. Cheap to bundle into P6.A.
