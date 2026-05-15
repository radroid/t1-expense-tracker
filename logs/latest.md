# Latest

Latest: iter-014 — Phase 4 fat-iter. P4.C+D (CSV export+import via shared
`src/lib/csv.ts` + `useExpenses.addMany`) bundled (PR #39); P4.I
(themability sweep — 16 component CSS files + 3 new vars) shipped (PR #40).
Dark mode now renders coherently across the entire app.

Stage: S3 (feature dev) — see `.loop/state.json` (`pr_mode: true`, `pr_size_policy: fat`)
Next step: iter-015 — fat-iter candidates: **P4.G (empty + loading polish)** +
  **P4.H (responsive layout down to 480px)**. Bundle as 2 PRs (or 1 if scope
  permits — they're orthogonal: P4.G touches per-component empty states,
  P4.H touches App.css + media queries). P4.E (recurring expenses) is the
  biggest remaining slice; ship it solo next iter after this one.
Open first: `GOALS.md`, `src/App.css` (P4.H starting point — responsive
  max-width + grid), the components with custom `__empty` classes
  (`ExpenseList`, `SpendingByCategory`, `MonthlySummary`), the loading
  surface (App.tsx `<p className="loading">Loading…</p>`).
Open blocks: none open — see `logs/blocks.md` for iter-014 super-reviewer
  notes (P4.I brand-accent hue shift design-choice flag).
Carry-forward: TD.6 (category-deletion cascade — product decision pending);
  deferred `useSpendingByCategory` (pair with P4.G); P3.D chart text
  aria-hidden follow-up (low priority); centralise localStorage test shim
  in src/test/setup.ts when a 2nd consumer lands; DateRangeFilter from>to
  normalize (super-review nit, low priority); CSV-injection prefix-escape
  on export (low priority for local-only app).
Test gate: 308 tests pass; `npm run build` + `npm run lint` clean.
Push: n/a — pr_mode, all work merged via PRs.

Last-iter shipped:
- P4.C + P4.D (#39): `src/lib/csv.ts` (formatExpensesCsv +
  parseExpensesCsv); `useExpenses.addMany` + `BulkAddResult`; `ExportButton`
  + `ImportButton` components; App.tsx wires both into a new `.app__csv`
  row between filters and the list.
- P4.I (#40): `src/index.css` adds `--app-accent-fg`, `--app-surface-2`,
  `--app-surface-hover` across all 4 theme scopes. 16 component CSS files
  migrated from hard-coded hex/rgb to vars. Two `:focus-visible` a11y
  additions (CategoryFilter select, ExpenseList delete) — keyboard nav
  was invisible in dark mode.

Operational notes for iter-015:
  - **Process-fix held**: staged by explicit path on every commit this iter;
    no `-A`, no recovery branches. Three-iter streak — keep it up.
  - Dark mode is now visually coherent. Manual screenshot check in dark
    mode (user-managed dev server) is the only outstanding verification.
  - `vite.config.ts` `fileParallelism: false` still load-bearing — keep.
  - Node 25 localStorage shim hack still present in test files using
    localStorage. Centralise when a 2nd consumer lands.
  - **addMany contract**: errors are message-only (no "Row N:" prefix).
    Callers add row context if they need it. ImportButton does this for
    parse errors (CSV line numbers) but NOT for addMany errors (since by
    that point, valid rows have been filtered — addMany errors are
    DB-failure rare).

Open questions for iter-015 (note in plan):
  (1) P4.G: shared `<EmptyState>` component vs per-component `__empty`
      classes? Lean: shared component (~6 consumers).
  (2) P4.H: breakpoints — 480px only or also 768px? Lean both.
  (3) P4.E (next iter after this): recurring as a new field on Expense
      (boolean + frequency enum) OR a separate `recurring_template` table?
      Lean: separate template + cron-style rollover in `useExpenses`.
