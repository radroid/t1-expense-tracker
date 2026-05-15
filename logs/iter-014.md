# iter-014

**Phase:** Phase 4 — Polish & power features · **Mode:** fat-iter (3 features,
2 PRs) · **pr_mode:** true

## Features landed

- **P4.C + P4.D (PR #39)** — CSV export + CSV import. Shared seam
  `src/lib/csv.ts` (hand-rolled tokenizer; header required; `ParseError {row,
  message}` where row=0 means header rejection and rows start at 2). New
  hook method `useExpenses.addMany` with `BulkAddResult { added, skipped,
  errors }`, skip-and-report policy, single state refresh. `ExportButton`
  downloads `visibleExpenses` (filtered); `ImportButton` separates
  header-error from row-error in `role="status"`.
- **P4.I (PR #40)** — themability sweep. 16 component CSS files + `index.css`.
  3 new vars (`--app-accent-fg`, `--app-surface-2`, `--app-surface-hover`)
  defined across all 4 theme scopes. Light palette preserved verbatim; dark
  palette contrast checks: fg/bg ~14.5:1, accent-fg/accent ~7.6:1,
  error/bg ~5.4:1.

Final gate: **308 tests pass**, tsc + lint + build clean.

## How it went

- Parallel Class B dispatch (P4.C+D and P4.I, disjoint file allowlists).
  Process-fix held — staged by explicit paths on every commit; no `-A`.
  Three-iter streak now.
- Two super-reviewer passes, both APPROVE.
- CodeRabbit: P4.C+D got 7 findings (3 applied — addMany row-prefix removal
  was the critical fix; 2 declined: try/catch noise + cleaned-fields refactor;
  2 lost in run pagination but verified clean on second pass). P4.I got 3
  findings; 2 a11y additions applied (focus-visible on category select +
  delete button — keyboard nav was invisible in dark mode), 1 declined as
  out-of-scope.

## Decisions / notes

- **addMany row prefix removed** — `addMany` no longer prefixes errors with
  `Row N:`. It has no notion of source-row coordinates; the caller (CSV
  parser, future importer) maps inputs back to whatever row scheme it needs.
  Was off-by-N once the parser had already dropped invalid rows. Public API
  contract change but no consumer outside the tests/ImportButton depended
  on it.
- **Export operates on `visibleExpenses`** — "export the user's view" — not
  the full expense set or the month slice. If a user filters to category=Food
  + date range Q1, that's what they get. Locks consistency with what's on
  screen.
- **Brand-accent unification** (P4.I) — original component CSS had blue
  highlights (`#2d6cdf`, `#1d4ed8`). P4.F's `--app-accent` is purple
  (`#aa3bff`) — the legacy palette's brand color. P4.I collapses both onto
  the single accent. Visible hue shift in light mode; flagged by
  super-reviewer as a design choice, not a regression.
- **Themability covers visual surface only** — P4.G (empty/loading states)
  is still its own polish item.

## Wake-up handoff

- **Current phase:** Phase 4. Done: P4.A, P4.B, P4.C, P4.D, P4.F, P4.I.
  Remaining: P4.E (recurring), P4.G (empty/loading polish), P4.H (responsive).
- **Next step:** iter-015 — fat-iter candidates: **P4.G (empty + loading
  polish)** + **P4.H (responsive layout down to 480px)**. P4.E (recurring)
  is the biggest remaining slice (needs a new field on Expense, month-rollover
  detection, auto-generation) — bundle P4.G + P4.H this iter and ship P4.E
  alone next iter. P4.G and P4.H are disjoint: P4.G touches per-component
  empty states + a shared `<EmptyState>` helper; P4.H touches `App.css` +
  per-component media queries.
- **Files to open first:** `GOALS.md`, `src/App.css` (P4.H starting point —
  responsive max-width and grid behavior), the components that currently
  ship a custom `__empty` class (`ExpenseList`, `SpendingByCategory`,
  `MonthlySummary`).
- **Open questions:** (1) P4.G — extract a shared `<EmptyState>` component
  or keep per-component `__empty` classes? Lean: shared component (~6
  consumers). (2) P4.H — breakpoints: just 480px (one-handed mobile) or also
  768px (tablet)? Lean both — `prefers-color-scheme` style media queries
  are cheap.
- **Carry-forward:** TD.6 (category-deletion cascade — product decision
  still pending); deferred `useSpendingByCategory` (pair with P4.G);
  P3.D chart `<text>` aria-hidden follow-up; centralise localStorage test
  shim in `src/test/setup.ts` when 2nd consumer lands; DateRangeFilter
  `from>to` normalize (super-review nit); CSV-injection prefix-escape for
  exports if/when export ever feeds a shared spreadsheet (low priority for
  local-only app).
- **Scheduled:** 600s (impl iter — Phase 4 tail).
