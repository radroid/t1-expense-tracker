# iter-027

**Phase:** Phase 6 (in progress) · **Mode:** single-feature
· **pr_mode:** true

## Features landed (PR #62)

- **P6.B** — Time-series analytics. New `src/lib/trends.ts`
  (`summarizeByMonth` ascending; `summarizeYear` fixed 12-slot
  grid with bad-year throw). New `src/lib/year.ts` mirrors
  `month.ts`. New `<YearSwitcher>` mirrors `<MonthSwitcher>`
  exactly (44px touch targets). New `<TrendsChart>` — pure-SVG,
  abbreviated Jan-Dec x-axis, single accent color via CSS class
  (no inline fill), `<title>` tooltips with pluralized counts,
  EmptyState fallback. App.tsx adds an always-visible Trends
  section between insights and budget; reads from full
  `expensesHook.expenses` (not visibleExpenses) so user
  month/category/search filters don't collapse the year view.

Final gate: **587 tests pass** (561 → 587, +26: +8 trends + +7
year + +4 YearSwitcher + +7 TrendsChart). Build 241.62 kB / gzip
72.68 kB clean. Lint clean.

## How it went

- Single Class B sub-agent owned the lib + components; main-agent
  integrated App.tsx (new imports, useMemo, section JSX) per the
  sub-agent's integration sketch.
- One pre-existing test broke during integration:
  `App.test.tsx`'s P6.E "1 expense" assertion was ambiguous
  because TrendsChart's `<title>` tooltip also contains
  `(1 expense)` for the seeded May expense. Disambiguated by
  scoping to `.category-manager__count` elements.
- Class A super-reviewer: APPROVE high-confidence. Combined
  contract + forced design review (UI feature with no automated
  visual signal). All design checklist items (mobile, touch
  targets, hierarchy, AA, theme tokens, empty state, consistency)
  green.
- CodeRabbit: 4 inline findings on first round.
  - blocks.md ordering — moved iter-027 entry below iter-026 ✓
  - App.test querySelector → querySelectorAll + toContainEqual ✓
  - TrendsChart maxHeight > 0 guard ✓
  - branded DateString type for `Expense.date` — **declined** as
    out-of-scope (would ripple through expense.ts + every
    construction site; runtime guard in createExpense already
    enforces format)
  - Second round: clean.
- Process-fix held: explicit-path staging on every commit.
  Fourteen-iter streak.

## Decisions / notes

- **Trends data sources from full expenses list, NOT
  visibleExpenses.** Year-over-year is a different lens than
  user's current month view; coupling them would surprise users.
- **`.trends-chart__bar` is CSS-only fill** (no inline `fill={...}`).
  Cleaner than the older `SpendingChart` which still inline-fills
  category colors. The TrendsChart cleanliness might motivate a
  future SpendingChart cleanup.
- **No view-mode toggle.** Trends section is always visible. Simpler
  v1 — avoids the conditional hide/show complexity. If users
  prefer a tabbed UX, that's a P6.C or follow-up call.

## Wake-up handoff

- **Current phase:** Phase 6, 3 of 5 items done. iter-028 picks up
  **P6.C accessibility audit pass**.
- **Next step:** iter-028 — accessibility audit sweep across all
  components. Sweep iter; resists fat-iter bundling because the
  review needs full-component context. Targets: ARIA roles +
  labels, keyboard navigation, focus management, screen-reader
  landmarks, form label association, AA contrast at component
  level. Dispatch a Class A `design-review` (or `a11y-review`)
  sub-agent for the visual gate; then Class B implementation
  follow-up.
- **Cadence:** 600s (impl-iter — sweep work, but concrete).
- **Files to open first for iter-028:** the components directory
  end-to-end. Start with the high-frequency surfaces:
  `ExpenseForm.tsx`, `ExpenseList.tsx`, `CategoryManager.tsx`,
  `RecurringManager.tsx`, `CategoryBudgetManager.tsx`,
  `BackupRestore.tsx` (dialog focus management), filters
  (`CategoryFilter`, `SearchBox`, `DateRangeFilter`).
  Sub-targets from prior carry-forward: P3.D chart `<text>`
  aria-hidden; the 12 month labels at <480px collision noted by
  the iter-027 design review; empty-state trailing-period
  normalize; P4.G follow-up.
- **Open questions for iter-028:**
  (1) Run an audit pass first (Class A dispatch) and let it
      enumerate findings, OR brief a Class B impl with a known
      list? Lean: audit-first. The findings will be more
      authoritative.
  (2) Should the audit also cover `<TrendsChart>` mobile-label
      crowding (the iter-027 nit)? Lean: yes, fold in.
  (3) Scope: ship one big a11y PR, or split into themed PRs
      (e.g. "ARIA + labels", "keyboard + focus", "responsive
      + contrast")? Lean: ship in 1-2 PRs depending on the
      audit's surface area.
- **Carry-forward:** TD.6 closed; TD.10 (expenseVisibility — still
  no non-React consumer); TD.12 (refresh-after-mutation isolation);
  TD.13 + TD.14 (3rd-consumer-rule met via P6.A; defer to
  Phase-6 → 7 arch pass); TD.15 (backupPipeline barrel); TD.17
  (App guard test gap); deferred `useSpendingByCategory` typing
  pair-up; P3.D chart text aria-hidden (folds into P6.C);
  DateRangeFilter from>to normalize; CSV-injection prefix-escape
  (now applies to BOTH CSVs); empty-state trailing-period
  normalize (folds into P6.C); P4.G follow-up (folds into P6.C);
  Blob-revoke race in Export/BackupExport/RecurringExport (3
  consumers now); filename-vs-exportedAt timezone skew;
  TrendsChart 12-label crowding at <480px (folds into P6.C).
