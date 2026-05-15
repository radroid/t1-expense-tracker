# iter-015

**Phase:** Phase 4 — Polish & power features · **Mode:** fat-iter (2 features,
2 PRs) · **pr_mode:** true

## Features landed

- **P4.G (PR #42)** — empty + loading polish. New shared components
  `<EmptyState>` (role=status, title/hint/icon, dashed-border zero-data
  card) and `<Spinner>` (role=status, aria-label + visually-hidden text,
  sm/md/lg, prefers-reduced-motion → visible static label). Wired into
  five surfaces (ExpenseList, SpendingByCategory, MonthlySummary,
  SpendingChart, App.tsx loading branch). +8 tests (5 EmptyState + 3
  Spinner).
- **P4.H (PR #43)** — responsive layout. ≤768px (tablet) + ≤480px (mobile)
  breakpoints across App.css + 17 component CSS files. Desktop unchanged.
  Touch targets ≥44px everywhere (forms, filters, CSV row, theme toggle,
  CategoryManager — last one was added in response to super-reviewer).
  No new CSS vars; pure layout/media-query work.

Final gate: **316 tests pass**, tsc + lint + build clean.

## How it went

- Parallel Class B dispatch with disjoint allowlists (P4.G owns `.tsx` +
  EmptyState.css + Spinner.css; P4.H owns all other `.css` files). Zero
  file overlap verified with `comm -12`. Process-fix held — explicit-path
  staging on every commit. Four-iter streak now.
- Super-reviewer over BOTH PRs (one reviewer for fat-iter coherence).
  Verdict NEEDS-WORK → applied CategoryManager 44px touch-target fix on
  P4.H. Re-verified clean.
- CodeRabbit: P4.G one nit (incorrect — declined with WAI-ARIA citation
  + documented in Spinner.tsx); P4.H 5 nits (all applied).

## Decisions / notes

- **Spinner aria-label + visually-hidden span BOTH kept on purpose** —
  CR flagged as redundant. Per WAI-ARIA 1.2, `role="status"` is NOT a
  name-from-content role (unlike button/link/heading). Without aria-label
  the element has no accessible name, only an accessible description via
  text. Both attributes load-bearing: aria-label = name, visually-hidden
  text = visible cue under reduced-motion. Documented in-file so future
  review passes short-circuit the same suggestion.
- **Empty-state copy preserved verbatim** where App-level integration
  tests query existing text ("No expenses yet.", "No spending yet.").
  Trailing-period inconsistency ("No data to chart" — no period) flagged
  by super-reviewer as nit; deferred (cosmetic).
- **box-sizing hoisted to base** on ExpenseForm + BudgetForm input
  selectors during P4.H CR triage. Applies defensively at all viewports;
  removes duplicate `box-sizing` from ≤480px override.
- **EmptyState behind whole insights block (not just list)** — super-
  reviewer nit: during initial load, insight cards briefly render their
  individual EmptyStates before hooks settle. Deferred as P4.G follow-up
  (small scope, low priority).

## Wake-up handoff

- **Current phase:** Phase 4. Done: P4.A, P4.B, P4.C, P4.D, P4.F, P4.G,
  P4.H, P4.I. Remaining: **P4.E (recurring expenses)** — the only Phase 4
  item left. After P4.E ships, Phase 4 closes and iter-NNN must run the
  mandatory **arch pass** before Phase 5.
- **Next step:** iter-016 — single-feature iter for **P4.E**. Per iter-014
  handoff open question: lean towards a separate `recurring_template`
  store (id, frequency, base ExpenseInput) + a rollover routine in
  `useExpenses` that runs on mount + monthly-tick. Don't add `recurring`
  to `Expense` itself (already there as optional but unused). New
  vertical slice: `src/db/recurringTemplateStore.ts`, `src/lib/recurring.ts`,
  `src/hooks/useRecurringTemplates.ts`, UI in CategoryManager-adjacent
  section or a new RecurringManager component.
- **Files to open first:** `GOALS.md`, `src/lib/expense.ts` (note the
  existing `recurring?: boolean` field — decide if we drop it), `src/db/db.ts`
  (DB schema version bump for new store), `src/hooks/useExpenses.ts`
  (rollover hook into addMany).
- **Open questions:** (1) DB v3 → v4 migration: backfill the new store
  empty, or detect any `recurring:true` expenses and seed templates from
  them? Lean empty (cleaner). (2) Rollover trigger: on App mount, on
  month-change in MonthSwitcher, or both? Lean both with idempotency.
  (3) Frequency enum: monthly only for v1, or weekly+monthly? Lean
  monthly only — simpler, ships faster.
- **Phase boundary after iter-016:** iter-017 MUST invoke
  `improve-codebase-architecture` skill before any Phase 5 feature work.
- **Carry-forward:** TD.6 (category-deletion cascade — product decision
  still pending); deferred `useSpendingByCategory` typing pair-up;
  P3.D chart `<text>` aria-hidden follow-up; centralise localStorage
  test shim in `src/test/setup.ts` when 2nd consumer lands;
  DateRangeFilter `from>to` normalize (low priority); CSV-injection
  prefix-escape on export (low priority for local-only app); empty-state
  trailing-period normalize; loading-state covers whole insights block
  (P4.G follow-up).
- **Scheduled:** 600s (impl iter — Phase 4 final feature).
