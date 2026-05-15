# Latest

Latest: iter-008 — P2.D (filter by category) shipped solo (PR #21). **Phase 2 done.**
Filter scopes ExpenseList + RunningTotal + SpendingByCategory.

Stage: S3 (feature dev) — see `.loop/state.json` (`pr_mode: true`, `pr_size_policy: fat`)
Next step: iter-009 — **phase-boundary architecture pass before Phase 3** (Budgets &
  insights). Invoke `Skill` tool `skill: "improve-codebase-architecture"` — not a manual
  refactor. Likely surfaces: TD.1 (formatCurrency dedup), TD.4 (useExpenses / useCategories
  hooks — App handler count is now 7), and the App.tsx orchestration hot-spot.
Open first: `GOALS.md`, `ARCHITECTURE.md` (if it exists), `src/App.tsx`, `src/lib/`,
  `logs/blocks.md`.
Open blocks: none open — see `logs/blocks.md` for iter-008 super-reviewer entry.
Carry-forward: TD.1 (formatCurrency — now quadruplicated), TD.4 (useExpenses/useCategories
  hooks), TD.5 (DB-migration test), TD.6 (category-deletion cascade — iter-008 stale-filter
  fix is one piece; data-side decision still open).
Test gate: 140 tests pass; `npm run build` + `npm run lint` clean.
Push: n/a — pr_mode, all work merged via PRs.

Last-iter shipped:
- P2.D: `filterExpensesByCategory` lib + `CategoryFilter` component + App-level filter
  state. Filter values `'all' | 'uncategorized' | <categoryId>`; `'uncategorized'`
  buckets undefined-categoryId + orphans (semantics match `spendingByCategory`'s null).
- Bug fix from super-review: `handleDeleteCategory` resets `filter` to `'all'` if the
  deleted category was being filtered on — prevented a silent empty-list / $0-totals UX.
