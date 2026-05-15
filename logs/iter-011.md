# iter-011

**Phase:** Phase 3 — Budgets & insights (closed) · **Mode:** fat-iter (3 features,
2 PRs) · **pr_mode:** true

## Features landed
- **P3.B + P3.F (PR #31)** — bundled. `useMonthlyBudgets` hook +
  `computeBudgetStatus` lib + `BudgetForm` + `BudgetVsActual` (progress bar +
  `role="alert"` over-budget warning when `actual > budget`). Budget is
  month-scoped, not category-filtered — comment in App.tsx documents this.
- **P3.D (PR #32)** — Pure SVG horizontal bar chart sharing the
  `spendingByCategory` data with the existing text list. Both surfaces live
  under the same "Spending by category" heading.

Final gate: **239 tests pass**, tsc + lint + build clean.

## How it went
- Parallel dispatch (P3.B+F + P3.D disjoint file sets, neither touched
  App.tsx) ran cleanly; main agent did the two App wirings sequentially as
  separate PRs.
- Two super-reviewer passes (one per PR), both APPROVE.
- CR triage: total 6 nits across the two PRs; 1 applied, 5 declined with
  reasons logged in PR bodies + blocks.md.

## Decisions / notes
- **Budget scope = month-only**, not category-filtered. RunningTotal and
  MonthlySummary follow the visible (filtered) slice; BudgetVsActual deliberately
  uses `monthlyExpenses` because the budget covers the whole month. Inline
  comment in App.tsx pins this.
- **"Budget amount" label** disambiguates from ExpenseForm's "Amount" — caught
  by the App-test suite immediately after wiring, not at design time. Next
  similar collision will be obvious.
- **P3.D heading** — shares "Spending by category" with the text list (same
  data, two presentations). Declined CR's separate-heading suggestion;
  super-reviewer agreed but flagged a follow-up: chart's `<text>` labels +
  bar `aria-label` may double-announce to screen readers (consider
  `aria-hidden` on `<text>` later).

## Process miss → recovery
`git add -A` swept P3.D's untracked SpendingChart files into the P3.B+F CR-nit
commit (same iter-010 mistake despite the logged lesson). Recovery: fresh branch
(`loop/iter-011-p3bf-budgets`), delete stale remote. Force-push correctly denied
by the auto-classifier. **The lesson didn't stick** — next iter's first CR-nit
commit must stage by explicit path.

## Wake-up handoff
- **Current phase:** **Phase 3 CLOSED.** All P3.A-P3.F shipped.
- **Next step:** iter-012 — **phase-boundary arch pass before Phase 4 starts.**
  Invoke `Skill` tool `skill: "improve-codebase-architecture"` (hard rule —
  this is the SECOND arch pass; first was iter-009's). Likely surfaces:
  TD.6 (category-deletion cascade — still a product decision); App.tsx is now
  loading-and-error-deriving across 3 hooks (any deepening there?); the
  filter pipeline composition (byMonth → byCategory) — does a `useVisibleExpenses`
  module pay off? Read also `src/components/SpendingByCategory.tsx` vs
  `src/components/SpendingChart.tsx` for any deduplication wins.
- **Files to open first:** `GOALS.md` (Phase 4 backlog), `ARCHITECTURE.md`,
  `src/App.tsx` (the orchestration center, growing), `src/hooks/`, `logs/blocks.md`.
- **Open questions:** none — arch pass surfaces its own.
- **Carry-forward:** TD.6 (product decision; still pending). The double-announce
  follow-up from P3.D super-review (low-priority `aria-hidden`).
- **Scheduled:** 1500s (planning iter — arch pass is exploration + grilling).
