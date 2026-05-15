# Latest

Latest: iter-024 — **cleanup-week shipped (PR #59).** Three pure-
subtraction items from the iter-023 arch pass landed in one
coherent PR: **TD.9** (`makeStore<T,K>` factory over 5 domain
stores), **TD.11** (drop vestigial `Expense.recurring`), **TD.16**
(delete `formatUSD` shim). Net −150 LOC.

Stage: S3 (post-Phase-5 cleanup done; pre-Phase-6 planning) — see
  `.loop/state.json` (`pr_mode: true`, `pr_size_policy: fat`)
Next step: iter-025 — **Phase 6 PLANNING iter**. Triage the
  candidate themes from the iter-022 handoff (per-expense
  currency w/ FX, analytics polish, recurring CSV, a11y audit,
  perf pass), pick 3-5, write as `P6.A`...`P6.E` in GOALS.md.
  No code work; thinking-iter.
Open first (for iter-025): `GOALS.md` Phase 6 stub; `logs/iter-017.md`
  (previous phase-boundary planning pattern); `logs/blocks.md`
  ## iter-023 + ## iter-024 sections; `logs/iter-022.md` "Phase 6
  themes (placeholder)" section for the candidate list.
Open blocks: none open. iter-024 super-reviewer logged under
  `## iter-024 — super-reviewer (cleanup-week TD.9 + TD.11 +
  TD.16)` with APPROVE high-confidence.

Test gate: 524 tests pass (527 → 524: −5 formatUSD tests + 5 new
  factory tests + −3 dropped recurring tests). `npm run build`
  234.21 kB clean. `npm run lint` clean.
Push: PR #59 (cleanup-week) — squash-merged.

Last-iter shipped (PR #59):
- `src/db/store.ts` (new) — `makeStore<T, K>(name)` factory
  returning `{ add, put, getAll, get, remove }`.
- `src/db/store.test.ts` (new) — 5 specs against the real
  fake-indexeddb seam (add+getAll, put-as-upsert, get hit+miss,
  remove, add-conflict-throws).
- 5 domain stores rewritten as thin wrappers:
  `expenseStore`, `categoryStore` (keeps `seedDefaultCategories`),
  `budgetStore`, `recurringTemplateStore`, `categoryBudgetStore`
  (keeps `categoryBudgetId` composite-key call).
- `src/lib/expense.{ts,test.ts}` — `recurring?: boolean` dropped
  from type + ExpenseInput + validateExpenseInput +
  applyExpenseEdit preservation branch + 3 tests removed.
- `src/lib/csv.{ts,test.ts}` — CSV format 5→4 cols (recurring
  column removed); `parseRecurring` helper deleted; 2 recurring-
  specific tests removed.
- `src/lib/currency.{ts,test.ts}` — `formatUSD` shim + its 5
  pinned tests deleted.
- `src/components/{ImportButton,MonthlySummary,SpendingChart}.test.tsx`
  — stale "formatUSD" test descriptions renamed; ImportButton
  fixtures updated to 4-col CSV form.

Operational notes for iter-025:
  - **Cadence:** 1500s (plan-iter — Phase 6 triage is thinking
    work).
  - **Process-fix held**: explicit-path staging on every commit.
    Twelve-iter streak. Keep it up.
  - `vite.config.ts` `fileParallelism: false` still load-bearing.
  - **localStorage shim centralised** in `src/test/setup.ts`.
  - **NEW seam: `src/db/store.ts`** — the `makeStore<T, K>`
    factory is now THE IDB seam. Any new entity store should use
    it; domain helpers stay in `src/lib/<entity>.ts`.
  - **DB version is 5**, backup `BACKUP_SCHEMA_VERSION` is 2,
    `useStoredCollection` is the hook seam, `errorMessages.ts`
    is the messaging seam, `currency.ts` is the formatter seam,
    `store.ts` is the IDB seam.

Open questions for iter-025 (Phase 6 triage):
  (1) Per-expense currency w/ FX — externally-fetched conversion
      rates would add a network dependency to a local-only app.
      Worth the scope, or out-of-band for this testbed?
  (2) Analytics polish (trends over time, year view) — needs a
      time-series aggregation primitive that doesn't exist yet.
      Net-new lib code vs. extending SpendingChart.
  (3) Accessibility audit — broad surface, low-individual-LOC.
      Good fat-iter candidate; would touch many CSS + ARIA spots.
  (4) Perf pass — Lighthouse measurement + bundle-splitting +
      code-splitting around RecurringManager / CategoryManager.
      Measurement work first, then ship.
  Pick 3-5 themes; expect Phase 6 to be ~5 iters like Phase 5 was.
