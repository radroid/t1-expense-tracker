# Latest

Latest: iter-015 — Phase 4 fat-iter. P4.G (empty/loading polish — shared
`<EmptyState>` + `<Spinner>`) shipped (PR #42); P4.H (responsive layout
≤768px + ≤480px) shipped (PR #43). The app is now mobile-friendly and
has consistent empty/loading UX.

Stage: S3 (feature dev) — see `.loop/state.json` (`pr_mode: true`, `pr_size_policy: fat`)
Next step: iter-016 — single-feature iter for **P4.E (recurring expenses)**,
  the only remaining Phase 4 item. Vertical slice: new
  `src/db/recurringTemplateStore.ts` (DB v3 → v4), `src/lib/recurring.ts`
  (rollover logic), `src/hooks/useRecurringTemplates.ts`, and a UI surface
  (RecurringManager component or section in CategoryManager). After P4.E,
  iter-017 MUST run the mandatory phase-boundary arch pass before any
  Phase 5 feature work.
Open first: `GOALS.md`, `src/lib/expense.ts` (note the existing optional
  `recurring?: boolean` — decide if we keep, drop, or repurpose),
  `src/db/db.ts` (schema version bump), `src/hooks/useExpenses.ts`
  (rollover hook calls into `addMany`).
Open blocks: none open — see `logs/blocks.md` for iter-015 super-reviewer
  notes (P4.G/P4.H combined APPROVE after CategoryManager touch-target
  fix; trailing-period copy inconsistency + insights-section EmptyState-
  during-load both deferred as nits).
Carry-forward: TD.6 (category-deletion cascade — product decision pending);
  deferred `useSpendingByCategory` typing pair-up; P3.D chart text
  aria-hidden follow-up (low priority); centralise localStorage test shim
  in src/test/setup.ts when a 2nd consumer lands; DateRangeFilter from>to
  normalize (low priority); CSV-injection prefix-escape on export (low
  priority for local-only app); empty-state trailing-period normalize;
  P4.G follow-up: loading spinner covers insights section during initial
  hook resolution.
Test gate: 316 tests pass; `npm run build` + `npm run lint` clean.
Push: n/a — pr_mode, all work merged via PRs.

Last-iter shipped:
- P4.G (#42): `src/components/EmptyState.{tsx,test.tsx,css}` +
  `src/components/Spinner.{tsx,test.tsx,css}` (new); wired into
  ExpenseList, SpendingByCategory, MonthlySummary, SpendingChart, and
  App.tsx loading branch. +8 tests (5 EmptyState + 3 Spinner).
- P4.H (#43): `@media (max-width: 768px)` + `@media (max-width: 480px)`
  blocks across App.css + 17 component CSS files. Header stacks vertically
  on mobile; forms full-width; ExpenseList rows wrap via flex+order;
  ≥44px touch targets across forms, filters, CSV row, CategoryManager
  (last one added per super-reviewer feedback). No new CSS vars.

Operational notes for iter-016:
  - **Process-fix held**: explicit-path staging on every commit. Four-iter
    streak. Keep it up.
  - **Phase 4 closes after P4.E** — iter-017 MUST start by invoking the
    `improve-codebase-architecture` skill before any Phase 5 feature work.
    This is a hard rule.
  - `vite.config.ts` `fileParallelism: false` still load-bearing — keep.
  - Node 25 localStorage shim hack still per-test-file. Centralise when
    2nd consumer lands. P4.E recurring-templates state COULD be that 2nd
    consumer if templates persist via localStorage instead of IndexedDB
    — but DB is the right choice (the rest of the app uses it).

Open questions for iter-016 (note in plan):
  (1) DB v3 → v4 migration: backfill the new templates store empty, or
      seed from any expenses with `recurring:true`? Lean empty.
  (2) Rollover trigger: on App mount, on MonthSwitcher month-change, or
      both? Lean both with idempotency (don't double-generate).
  (3) Frequency enum: monthly only for v1, or weekly+monthly? Lean
      monthly only — simpler, ships faster, sufficient for the feature.
  (4) UI placement: new RecurringManager component as its own section
      next to CategoryManager, or fold into existing forms? Lean new
      section — recurring is a distinct concept.
