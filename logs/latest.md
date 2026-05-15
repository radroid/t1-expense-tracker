# Latest

Latest: iter-016 — P4.E (recurring expenses) shipped (PR #45). **Phase 4
CLOSED**: all 9 items (P4.A through P4.I) are done.

Stage: S3 (feature dev — phase boundary) — see `.loop/state.json`
  (`pr_mode: true`, `pr_size_policy: fat`)
Next step: iter-017 — **MANDATORY PHASE-BOUNDARY ARCH PASS**. Hard rule
  from the loop protocol: before any Phase 5 feature work, invoke the
  `improve-codebase-architecture` skill (an actual tool call, not a
  concept), surface deepening opportunities, and log results to
  `logs/blocks.md` with `**Source:** arch-pass`. The arch pass output
  drives any pre-Phase-5 refactor and shapes the Phase 5 backlog in
  `GOALS.md` (currently a stub awaiting triage).
Open first: `GOALS.md` (Phase 5 stub), `logs/iter-016.md` (P4.E adds a
  new seam — recurring/sourceTemplateId — worth considering in the arch
  scan). The seam most likely to surface as a deepening candidate: the
  four hook-shape duplications (`useExpenses`, `useCategories`,
  `useMonthlyBudgets`, `useRecurringTemplates` all share the
  `{ loading, error, add/remove, last-error-clears-on-success }` shape).
Open blocks: none open — see `logs/blocks.md` for iter-016 super-reviewer
  notes (APPROVE with 3 nits — 1 declined as wrong, 1 applied, 1
  deferred as theoretical).
Carry-forward: TD.6 (category-deletion cascade — product decision still
  pending); deferred `useSpendingByCategory` typing pair-up; P3.D chart
  text aria-hidden follow-up; centralise localStorage test shim in
  `src/test/setup.ts` when 2nd consumer lands; DateRangeFilter from>to
  normalize (low priority); CSV-injection prefix-escape on export (low
  priority for local-only app); empty-state trailing-period normalize;
  P4.G follow-up: spinner covers insights section during initial hook
  resolution; CSV export/import of recurring templates.
Test gate: 373 tests pass; `npm run build` + `npm run lint` clean.
Push: n/a — pr_mode, all work merged via PRs.

Last-iter shipped:
- P4.E (#45): `src/db/db.ts` DB v3→v4 + `recurringTemplates` store;
  `src/db/recurringTemplateStore.{ts,test.ts}`;
  `src/lib/recurring.{ts,test.ts}` (pure: createRecurringTemplate,
  dueTemplatesForMonth, generateDueExpenses; frequency: monthly,
  dayOfMonth 1..28); `src/hooks/useRecurringTemplates.{ts,test.ts}`
  (mirrors useMonthlyBudgets shape); `src/components/RecurringManager.{tsx,
  test.tsx,css}` (add/list/delete, awaits onAdd → only clears form on
  success); `src/lib/expense.ts` (+sourceTemplateId field, carried
  through validate + applyExpenseEdit); `src/App.tsx` (useEffect
  rollover wiring); App.test.tsx (rollover integration). +57 tests
  (316 → 373).

Operational notes for iter-017:
  - **PHASE BOUNDARY** — Hard rule. Invoke `Skill` tool with
    `skill: "improve-codebase-architecture"` as the FIRST action. This
    is an actual tool call, NOT just reading the doc and improvising.
  - **Cadence:** arch pass is plan-iter, schedule 1500s for the next
    wake-up after closeout (impl pace returns once Phase 5 starts).
  - **Process-fix held**: explicit-path staging on every commit.
    Five-iter streak. Keep it up.
  - `vite.config.ts` `fileParallelism: false` still load-bearing — keep.
  - Node 25 localStorage shim hack still per-test-file. Centralise when
    2nd consumer lands.
  - **DB version is now 4**. Future schema changes bump to 5+.
  - **`Expense.recurring?: boolean` field is vestigial** since P4.E. Do
    NOT remove without a planned breaking-change iter — it's still in
    the persisted shape of historical expenses.

Open questions for iter-017 (arch pass should triage):
  (1) Hook shape duplication — `useExpenses`, `useCategories`,
      `useMonthlyBudgets`, `useRecurringTemplates`. Generic
      `useStoredCollection<T>` candidate? Apply the deletion test:
      would extracting it concentrate complexity or just move it across
      4 thin call sites?
  (2) Filter-pipeline composition — `useVisibleExpenses` chains 4
      filter steps with budget-coherence carveout. Is the seam right,
      or is it ripe for a `filter-pipeline.ts` lib that returns
      `{ monthlyExpenses, visibleExpenses }` without React?
  (3) Phase 5 themes to triage in arch pass output:
      per-category budgets; multi-currency; JSON backup/restore; URL
      filter persistence; account/sync (would break local-only — needs
      product decision before scoping).
