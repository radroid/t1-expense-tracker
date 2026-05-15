# Latest

Latest: iter-013 — Phase 4 fat-iter. P4.A (search) + P4.B (date-range) bundled
(PR #36); P4.F (dark mode) shipped (PR #37). Filter pipeline now spans 4
view-state layers behind one `useVisibleExpenses` seam.

Stage: S3 (feature dev) — see `.loop/state.json` (`pr_mode: true`, `pr_size_policy: fat`)
Next step: iter-014 — fat-iter candidates: **P4.C (CSV export)** + **P4.D
  (CSV import)** + **P4.I (themability sweep — migrate per-component CSS
  to the dark-mode vars introduced in P4.F)**. P4.C + P4.D share a CSV
  parser/formatter (`src/lib/csv.ts`); bundle as one PR. P4.I is orthogonal
  (touches only per-component CSS files and possibly adds 2-3 more vars to
  `index.css`).
Open first: `GOALS.md`, `src/hooks/useExpenses.ts` (CSV import will add a
  bulk-add method or call existing `add` N times), the per-component CSS
  files for P4.I (ExpenseList.css, CategoryFilter.css, MonthSwitcher.css,
  ExpenseForm.css, BudgetForm.css), `src/index.css` (var palette).
Open blocks: none open — see `logs/blocks.md` for iter-013 super-reviewer
  notes (especially the P4.I scope-cut note from P4.F's super-review).
Carry-forward: TD.6 (category-deletion cascade — product decision pending);
  deferred `useSpendingByCategory` (pair with P4.G); P3.D chart text
  aria-hidden follow-up (low priority); centralise localStorage test shim
  in src/test/setup.ts when a 2nd consumer lands; DateRangeFilter from>to
  normalize (super-review nit, low priority).
Test gate: 280 tests pass; `npm run build` + `npm run lint` clean.
Push: n/a — pr_mode, all work merged via PRs.

Last-iter shipped:
- P4.A + P4.B (#36): `filterExpensesBySearch` + `filterExpensesByDateRange`
  lib helpers; `useVisibleExpenses` signature extended with `searchTerm` +
  `dateRange`; `SearchBox` + `DateRangeFilter` components.
- P4.F (#37): `src/lib/theme.ts` seam (load/save/apply/toggle); `ThemeToggle`
  component; CSS custom properties on `:root` / `[data-theme="light"]` /
  `[data-theme="dark"]` blocks; first-paint apply in `src/main.tsx` to
  avoid light→dark flash.

Operational notes for iter-014:
  - **Process-fix held**: staged by explicit path on every commit this iter;
    no `-A`, no recovery branches. Two-iter streak — keep it up.
  - Dark mode is functionally complete but visually mixed because per-
    component CSS still has hard-coded light colors. **P4.I** (themability
    sweep) is the natural follow-up; doing it next iter while the
    var palette is fresh in mind is cheap.
  - `vite.config.ts` `fileParallelism: false` still load-bearing — keep.
  - Node 25 quirk: test files using localStorage install a `Storage` shim
    in `beforeAll`. Don't remove without confirming jsdom + Node-version
    fixed the underlying issue.

Open questions for iter-014 (note in plan):
  (1) CSV import: header row required vs sniffed? Lean required, reject otherwise.
  (2) Bulk-add validation: partial-failure policy. Lean skip-and-report
      with a count (don't roll back successful rows).
  (3) P4.I: add new CSS vars (`--app-input-bg`, `--app-button-bg`,
      `--app-button-hover-bg`) or reuse the 8 existing? Lean: add 2-3 more.
