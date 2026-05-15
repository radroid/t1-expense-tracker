# Latest

Latest: iter-011 — Phase 3 closed. P3.B + P3.F (PR #31) and P3.D (PR #32)
shipped. All six Phase-3 features (P3.A–P3.F) merged across iters 10 and 11.

Stage: S3 (feature dev) — see `.loop/state.json` (`pr_mode: true`, `pr_size_policy: fat`)
Next step: iter-012 — **phase-boundary arch pass before Phase 4** (Polish & power
  features). Hard rule from the loop protocol: invoke `Skill` tool
  `skill: "improve-codebase-architecture"`. Likely surfaces: TD.6 (category-
  deletion cascade — still pending product decision), the App.tsx
  loading/error derivation across 3 hooks, the filter pipeline
  composition (would a `useVisibleExpenses` deepening pay off?), and dedup
  candidates between SpendingByCategory + SpendingChart.
Open first: `GOALS.md` (Phase 4 backlog), `ARCHITECTURE.md`, `src/App.tsx`
  (the orchestration center is growing), `src/hooks/`, `logs/blocks.md`.
Open blocks: none open — see `logs/blocks.md` for iter-011 super-reviewer
  notes + the recurring `-A` process miss.
Carry-forward: TD.6 (product decision; pending); P3.D low-priority follow-up
  (consider `aria-hidden` on chart `<text>` to avoid screen-reader
  double-announce alongside bar aria-labels).
Test gate: 239 tests pass; `npm run build` + `npm run lint` clean.
Push: n/a — pr_mode, all work merged via PRs.

Last-iter shipped:
- P3.B + P3.F (#31): `useMonthlyBudgets` hook, `computeBudgetStatus` lib,
  `BudgetForm`, `BudgetVsActual` (progress bar + over-budget warning).
  Budget is month-scoped, not category-filtered.
- P3.D (#32): pure SVG `SpendingChart` sharing `spendingByCategory` data with
  the existing text list (both under the "Spending by category" heading).

Operational notes for iter-012:
  - **Recurring miss**: I logged a "use explicit file paths in `git add`" lesson
    after iter-010, then repeated the mistake on this iter. Branch recovery
    pattern works but is friction. Next iter: stage by path on the FIRST commit
    after a sub-agent fat-iter. Consider promoting to CLAUDE.md if it happens a
    third time.
  - **Arch-pass mandatory:** Phase 3 → Phase 4 boundary. Don't skip the
    `improve-codebase-architecture` skill invocation; it must be a real tool
    call, not a manual refactor.
  - `vite.config.ts` `fileParallelism: false` is load-bearing — keep.

Open questions for iter-012 (arch pass will surface its own):
  (1) Does App.tsx warrant deepening into a `useVisibleExpenses` (filter pipeline)
      or `useAppState` (loading/error derivation across 3 hooks)?
  (2) SpendingByCategory + SpendingChart share `spendingByCategory(...)` calls.
      Wrap in a hook? Or live with the duplication (deletion test before doing).
  (3) TD.6 needs a product decision — orphan-via-Uncategorized is currently
      coherent across all surfaces, but the data-side hasn't been ratified.
