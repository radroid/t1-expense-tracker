# iter-016

**Phase:** Phase 4 — Polish & power features (FINAL ITER) · **Mode:**
single-feature · **pr_mode:** true

## Feature landed

- **P4.E (PR #45)** — recurring expenses. New IndexedDB store
  `recurringTemplates` (DB v3 → v4). New `src/lib/recurring.ts` pure seam
  (`createRecurringTemplate`, `dueTemplatesForMonth`, `generateDueExpenses`).
  Idempotency rides on new optional `Expense.sourceTemplateId` —
  template T is "due for month M" iff no expense exists with
  `sourceTemplateId === T.id` AND date in M. Rollover in App.tsx as a
  single `useEffect` (deps include `expensesHook.expenses` so the
  post-addMany re-fire dedupes correctly). New `<RecurringManager>`
  section near `<CategoryManager>`.

Final gate: **373 tests pass** (316 → 373, +57), tsc + lint + build clean.

## How it went

- Single Class B sub-agent, allowlist covering 9 new files + 6 edits.
  Process-fix held — explicit-path staging on every commit. Five-iter
  streak.
- CodeRabbit: 8 findings (5 applied, 3 declined with reasons). Most
  notable applied fix: `RecurringManager` now `await`s `onAdd`'s
  `Promise<boolean>` and only clears the form on success — failures
  preserve user input.
- Super-reviewer APPROVE with 3 nits: 1 declined (eslint-disable line
  was wrongly flagged — `addMany` IS referenced but excluded from deps
  intentionally; the disable is load-bearing), 1 deferred as theoretical
  (dueTemplatesForMonth date-prefix slice — `createExpense` already
  validates), 1 applied (`onDelete` prop tightened to `Promise<boolean>`
  to mirror `onAdd`).

## Decisions / notes

- **Separate store, not a field on Expense** — `recurringTemplates`
  store keyed by template id. Cleaner than overloading Expense with
  `recurring:true` markers. The legacy `Expense.recurring?: boolean`
  field is now vestigial; kept to avoid a breaking schema change.
- **Monthly frequency only for v1** — `frequency: 'monthly'` enum has
  one value. dayOfMonth restricted to 1..28 to dodge month-length edges
  (no Feb 29/30/31, no April 31). Future weekly/yearly extends the enum
  + date builder.
- **Rollover trigger: both mount + month-change with idempotency** —
  one `useEffect` watches `(templates, expenses, selectedMonth)`. The
  dep on `expenses.expenses` is critical: after `addMany` resolves, the
  new expenses flip the next `dueTemplatesForMonth` to empty, the effect
  re-runs but no-ops. No regen loop.
- **DB migration v3 → v4: backfill empty** — the existing upgrade loop
  in `openDb()` creates any missing store, so no extra migration code
  was needed. Test covers BOTH v2→v4 and v3→v4 paths with real seeded
  data — old expenses + budgets survive.
- **CSV import/export of templates NOT in scope** — tracked as
  carry-forward. If templates need transport, add to `csv.ts` lib next.

## Phase 4 closed

All 9 Phase 4 items shipped (P4.A through P4.I). **iter-017 MUST run the
mandatory phase-boundary architecture pass** (`improve-codebase-architecture`
skill invocation) before any Phase 5 feature work. Hard rule from the
loop protocol.

## Wake-up handoff

- **Current phase:** Phase 4 CLOSED.
- **Next step:** iter-017 — **mandatory arch pass** (invoke
  `improve-codebase-architecture` skill as the very first action; log
  result to `logs/blocks.md` with `**Source:** arch-pass`). The arch
  pass output drives any pre-Phase-5 refactor and shapes the Phase 5
  backlog in `GOALS.md` (currently a stub).
- **Files to open first:** `GOALS.md` Phase 5 stub, the iter-016 diff
  (P4.E adds a new seam — recurring/sourceTemplateId — that should be
  considered when scanning for shallow modules). The seam most likely
  to surface as a candidate: the three hook-shape duplications
  (`useExpenses`, `useCategories`, `useMonthlyBudgets`,
  `useRecurringTemplates` all have nearly-identical
  `{ loading, error, add/remove, last-error-clears-on-success }` shape).
- **Open questions:** the arch pass MAY surface a `createPersistentList`
  / `useStoredCollection` generic — flag it but don't auto-merge into
  Phase 5 unless the deletion test passes. Premature abstraction risk.
- **Carry-forward:** TD.6 (category-deletion cascade — product decision
  still pending; this iter doesn't touch it); deferred
  `useSpendingByCategory` typing pair-up; P3.D chart `<text>`
  aria-hidden follow-up; centralise localStorage test shim in
  `src/test/setup.ts` when 2nd consumer lands; DateRangeFilter
  `from>to` normalize (low priority); CSV-injection prefix-escape on
  export (low priority); empty-state trailing-period normalize;
  P4.G follow-up: spinner covers insights section during initial hook
  resolution; CSV export/import of recurring templates (carry-forward
  from this iter).
- **Scheduled:** 1500s (PLAN-cadence iter — arch pass is a thinking
  pass, not an impl pass; longer cadence is appropriate).
