# Latest

Latest: iter-007 — P2.E (category badges) + P2.F (spending by category) shipped
(PRs #18, #19). Categories are now first-class through the whole UI.

Stage: S3 (feature dev) — see `.loop/state.json` (`pr_mode: true`, `pr_size_policy: fat`)
Next step: iter-008 — ship **P2.D (filter by category) solo** — the last Phase 2
  feature. Adds a category filter control above the expense list; App owns the visible-
  expense state. Open question: scope `RunningTotal` + `SpendingByCategory` to the
  filtered set too (leaning yes — header should reflect what the user sees). After P2.D
  → Phase 2 done → **phase-boundary arch pass before Phase 3** (Budgets & insights).
Open first: `GOALS.md`, `src/App.tsx`, `src/components/ExpenseList.tsx`,
  `src/lib/category.ts`.
Open blocks: none open — see `logs/blocks.md` for iter-007 peer-review entry.
Carry-forward: TD.1 (formatCurrency — now triplicated, getting pressing), TD.4
  (useExpenses/useCategories hooks), TD.5 (DB-migration test), TD.6 (category-deletion
  cascade). A refactor iter for TD.1 + TD.4 after the Phase-2 arch pass is timely.
Test gate: 130 tests pass; `npm run build` + `npm run lint` clean.
Push: n/a — pr_mode, all work merged via PRs.

Last-iter shipped:
- P2.E: ExpenseList badges (colored swatch + name, orphan/uncategorized → no badge).
- P2.F: `spendingByCategory` reducer + `SpendingByCategory` component (sorted desc;
  orphans bucketed as "Uncategorized" — UX coherent with P2.E's silent badge).
