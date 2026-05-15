# Latest

Latest: iter-009 — phase-boundary arch pass (Phase 2 → 3). 3 PRs merged:
TD.1 currency formatter (#23), TD.2 applyExpenseEdit field preservation (#24),
TD.4 useExpenses + useCategories hooks (#25). App.tsx no longer imports `src/db/`.

Stage: S3 (feature dev) — see `.loop/state.json` (`pr_mode: true`, `pr_size_policy: fat`)
Next step: iter-010 — **Phase 3 begins.** Fat-iter candidates: **P3.A**
  (MonthlyBudget model + store), **P3.C** (Month switcher), **P3.E** (Monthly
  summary). P3.B (budget vs actual) depends on P3.A; either solo-next or paired
  with the store. Independence holds if month-state shape is decided up front.
Open first: `GOALS.md`, `ARCHITECTURE.md` (MonthlyBudget data model line),
  `src/db/db.ts` (DB v3 + monthlyBudgets store), `src/hooks/useExpenses.ts`
  (template for `useMonthlyBudgets`), `src/App.tsx`.
Open blocks: none open — see `logs/blocks.md` for iter-009 arch-pass entry.
Carry-forward: TD.5 (DB-migration test — load-bearing for v3 schema bump),
  TD.6 (category-deletion cascade — product decision).
Test gate: 159 tests pass; `npm run build` + `npm run lint` clean.
Push: n/a — pr_mode, all work merged via PRs.

Last-iter shipped:
- TD.1: `src/lib/currency.ts::formatUSD`; RunningTotal / ExpenseList /
  SpendingByCategory import it. 5 unit tests pin 2dp + rounding direction.
- TD.2: `applyExpenseEdit` now merges `categoryId` / `recurring` from `existing`
  when input omits them. 3 new tests; contract documented inline.
- TD.4: `src/hooks/useExpenses.ts` + `useCategories.ts` own state, load,
  mutations, error. App.tsx down 60 lines. 11 new hook tests via renderHook.

Open questions for iter-010 (note in plan):
  (1) Month state shape — `'2026-05'` string seems simplest; helper
      `monthOf(dateISO)` = `dateISO.slice(0, 7)`.
  (2) Does P3.C's month filter compose with P2.D's category filter? Lean
      orthogonal — both narrow the visible slice in series.
  (3) Land TD.5 (DB-migration test) before or with iter-010's v3 bump.
