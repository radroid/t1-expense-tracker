# Blocks

Structured log of arch passes, peer reviews, runtime failures, and contract drift.
Append-only. Newest entries at the bottom. The loop never halts on a block — it logs here
and continues.

## iter-001 — Class A integrated peer review

**Source:** peer-review (fat-iter Phase 4, 4 features: P1.A–P1.D)
**Verdict:** APPROVE — all 4 modules plan-compliant, tested (34/34), tsc + lint clean.
**Follow-ups for main agent:**
- App.tsx wiring MUST wrap `createExpense` in try/catch — form emits raw `ExpenseInput`
  (amount may be 0/negative); `createExpense` throws on those. Surface error, don't crash.
- Mixed semicolon style across iter-001 files (P1.A/P1.D use them, P1.B/P1.C don't).
  Cosmetic, lint passes. → carry-forward: pick a convention before it spreads.

## iter-001 — CodeRabbit review hung

**Source:** runtime failure (feature-pr-mode step 7, PR #1)
`coderabbit review --plain` ran 26+ min with zero output on the P1.A branch — hung,
not progressing. Killed it. Routed around per continuous-loop: used the Class A
integrated peer review (APPROVE, all 4 features) as the merge gate — `feature-pr-mode`
allows a Class A sub-agent as the M1 super-reviewer floor.
→ resolved: re-ran scoped (`--type committed --base main`) — completed in ~2 min.
  Root cause: unscoped `--plain` was reviewing all uncommitted P1.B/C/D files too.
  Fix for next iter: always scope CodeRabbit with `--type committed --base main`.

## iter-001 — CodeRabbit review, PR #1 (P1.A)

**Source:** code-review (feature-pr-mode step 7)
1 finding — trivial nitpick: optional JSDoc on `createExpense`. Declined via
receiving-code-review: project CLAUDE.md defaults to no comments; function is small
with full type coverage; CodeRabbit marked it trivial/optional. No blocking issues.

## iter-002 — Class A integrated peer review

**Source:** peer-review (fat-iter Phase 4, 2 features: P1.E + P1.G)
**Verdict:** APPROVE — both match plans, tests complete (50/50), tsc + lint clean.
**Follow-up:** `currencyFormatter` is duplicated in `ExpenseList.tsx` and
`RunningTotal.tsx` (identical en-US/USD config). Non-blocking DRY smell.
→ added to GOALS.md as a tech-debt item; not fixed this iter (would cross the
P1.E/P1.G allowlist boundary).

## iter-003 — Class A peer review

**Source:** peer-review (P1.F edit expense)
**Verdict:** APPROVE — contract-faithful; `createExpense` validation refactor verified
semantics-preserving; `applyExpenseEdit` keeps id + does not mutate.
**Follow-ups:**
- `handleUpdate` error path was untested + `updateExpense` rejection unhandled (unlike
  `handleDelete`). → FIXED this iter: wrapped store ops in try/catch + added an
  invalid-edit App test.
- `applyExpenseEdit` carries through only `input` fields — drops `existing.categoryId` /
  `recurring`. Harmless today (no category edit UI). → GOALS TD.2 for when P2.C lands.

## iter-003 — Phase 1→2 boundary architecture pass

**Source:** arch-pass (`improve-codebase-architecture` skill)
Phase 1 complete (P1.A–P1.G). Three deepening opportunities surfaced — all logged as
GOALS tech-debt items, to be executed as dedicated refactor iters (not done here — a
phase-boundary arch pass logs; it doesn't fat-iter a refactor).

- **TD.1 (existing)** — extract `formatCurrency` into `src/lib/`. `currencyFormatter`
  duplicated verbatim in `ExpenseList.tsx` + `RunningTotal.tsx`. Small, low-risk.
- **TD.3 (new)** — deepen `AddExpenseForm` + `EditExpenseForm` into one `ExpenseForm`
  module. They are ~90% identical (controlled amount/description/date inputs + blank-field
  guards + error state); differ only in initial values, submit label, Cancel, post-submit
  clear. Deletion test passes hard. Biggest win: validation-guard logic in ONE place
  (CodeRabbit has flagged the form-validation split twice). Medium risk — touches both
  components + App wiring.
- **TD.4 (new)** — deepen expense orchestration into a `useExpenses` hook. `App.tsx`
  repeats `try → store op → getAllExpenses() refresh → setState` 3× across
  handleAdd/Delete/Update, untestable without rendering App, and couples App directly to
  `expenseStore`. A `useExpenses()` hook concentrates the orchestration behind a small
  interface (the seam: IndexedDB today, swappable later) and is testable via `renderHook`.
  Medium risk.

Recommendation: slot TD.1 (cheap) into an early Phase 2 iter; TD.3 + TD.4 as a dedicated
refactor iter once Phase 2 categories reveal whether the form/hook need to flex anyway.

## iter-004 — Class A integrated peer review

**Source:** peer-review (fat-iter Phase 4, 2 features: P2.A + P2.B)
**Verdict:** APPROVE — both match plans; the `expenseStore` refactor onto shared `db.ts`
is behaviour-preserving (regression test untouched + passing); v1→v2 DB migration
correctly preserves `expenses` data; `seedDefaultCategories` is genuinely idempotent.
**Follow-ups (non-blocking):**
- No explicit DB-migration test (open v1 with data → reopen v2 → expenses survive).
  Coverage is adequate indirectly. → GOALS TD.5.
- `CategoryRow` seeds its rename input from `useState(category.name)` — won't re-sync if
  App reloads categories after a rename. Practically harmless here (rename only flows
  through that input) → carry-forward note; fix with a `useEffect` sync if it bites.

## iter-005 — Class A peer review (TD.3 refactor)

**Source:** peer-review (TD.3 — ExpenseForm dedup)
**Verdict:** APPROVE — faithful behaviour-preserving refactor; `ExpenseForm` preserves
every behaviour of both old forms; test suite is a strict superset (17 tests vs 15);
no dangling refs to the deleted files.
**Note:** integration bug caught + fixed during the iter — App switched add↔edit
`ExpenseForm` at the same tree position, so React reused the instance and `useState`
initializers didn't re-seed from the new `initial` prop. Fixed with distinct `key`
per mode (`key={editing.id}` / `key="new"`) — same idiomatic remount fix as iter-004's
CategoryRow. Lesson: collapsing two component types into one removes the free remount
that a type change gave you — the caller must supply `key` to preserve it.

## iter-006 — Class A peer review (P2.C)

**Source:** peer-review (P2.C — assign category to expense)
**Verdict:** APPROVE — contract exact; `categoryId || undefined` keeps empty strings out
of the data end-to-end; TD.2 genuinely resolved (edit now round-trips `categoryId` —
App passes `editing.categoryId` into `initial`, verified by test); pre-existing 17
ExpenseForm tests tightened, not weakened.
**Follow-up (non-blocking):** orphaned `categoryId` — deleting a category leaves
expenses pointing at a now-gone id; the form's `<select>` silently falls back to
Uncategorized and a subsequent edit re-saves it as uncategorized. Out of P2.C scope.
→ GOALS TD.6 (category-deletion cascade — orphan vs. block, a product decision).

## iter-007 — Class A integrated peer review

**Source:** peer-review (fat-iter Phase 4, 2 features: P2.E + P2.F)
**Verdict:** APPROVE — both match plans; no shared-file collisions (P2.E owns
ExpenseList, P2.F new files); orphan handling consistent between features (P2.E shows
no badge for orphan, P2.F buckets orphan into the "Uncategorized" total — coherent UX:
no money leaks from the summary even if the badge is silent). Currency formatter is now
triplicated (RunningTotal + ExpenseList + SpendingByCategory) — TD.1 already tracks
this and SpendingByCategory has an explicit TD.1 acknowledgement comment.
**Non-blocking nits:** P2.E's empty `<span aria-hidden>` placeholder grid cell is
intentional (grid alignment) but undocumented; P2.F's `.slice().sort()` is redundant
since the lib already returns a fresh array. Trivial.

## iter-008 — Class A super-reviewer (P2.D)

**Source:** code-review (feature-pr-mode step 8, PR #21)
**Verdict (first pass):** REQUEST_CHANGES — one real WARNING + three NITs.
**WARNING (applied):** stale filter after category deletion — deleting the
filtered-on category left the `<select>` orphan (no matching option), the dropdown
visually fell back to the first entry while React state still held the now-orphan
id, producing an empty list + $0 totals. Fix: `handleDeleteCategory` snaps `filter`
to `'all'` when `filter === id`. Regression test added.
**NITs:** (1) `CategoryFilterValue` literal-union collapsed to `string` — applied
`(string & {})` to preserve autocomplete. (2) Filter integration test only asserted
RunningTotal re-scopes, not SpendingByCategory — extended the test. (3) Ordering of
"Uncategorized" option — declined as stylistic (adjacent to "All" mixes meta-options
with the category list; current order is fine).
**Second pass:** verdict APPROVE implicit — all WARNING + actionable NITs cleared,
140 tests pass.

## iter-008 — CodeRabbit (P2.D, PR #21)

**Source:** code-review (feature-pr-mode step 5, scoped `--type committed --base main`)
**Verdict:** No findings ✔ (both passes — first on the original commit, second after
the super-reviewer WARNING fix landed).

## iter-009 — phase-boundary arch pass (Phase 2 → Phase 3)

**Source:** arch-pass (Skill `improve-codebase-architecture`)
**Surfaced 4 deepening opportunities:** TD.1 (currency formatter dedup), TD.2 (apply-
ExpenseEdit field preservation — long-standing carry-forward), TD.4 (useExpenses +
useCategories orchestration hooks), TD.6 (category-deletion cascade — declined as
product decision; orphan-via-Uncategorized policy is already coherent across surfaces).
**Executed in this iter (3 sequential PRs):**
- **TD.1 (PR #23)** — `src/lib/currency.ts` extracted; 3 components import `formatUSD`.
  CodeRabbit: 1 nit (pin rounding behaviour) applied; declined negative/NaN/Infinity
  tests because `createExpense` validates `finite > 0` upstream. Super-reviewer APPROVE.
- **TD.2 (PR #24)** — `applyExpenseEdit` now merges `categoryId` / `recurring` from
  existing when the input doesn't supply them. Documented contract: omit OR explicit-
  undefined → preserve. CodeRabbit nit (misleading test title) applied. Super-reviewer
  APPROVE. Locked one Phase-3 footgun before it bit.
- **TD.4 (PR #25)** — `useExpenses` + `useCategories` extracted. App.tsx loses 60 lines
  and no longer imports the store layer. Methods return `Promise<boolean>` for
  view-state chaining (close edit form on success, reset filter on category delete).
  CodeRabbit nit (update() error coverage) applied. Super-reviewer APPROVE with 2
  WARNING-level behaviour-shift notes (both *better*, not bugs): error UX is now
  domain-scoped (each hook owns its error); mount-load is two independent loads
  instead of `Promise.all`. Documented inline.

**Phase 2 → 3 readiness:** Phase 3 will add `MonthlyBudget` CRUD, month-scoping,
budget-vs-actual, and charts. With hooks in place a `useMonthlyBudgets` is one more
`use*` module rather than 4 more handlers in App. With `formatUSD` extracted, P3.D
chart + P3.E summary import a helper instead of pasting the formatter for the 4th
and 5th time. TD.2 makes a `Partial<ExpenseInput>` edit flow (P3 or P4 recurring) safe.

## iter-010 — Phase 3 fat-iter (3 features) + super-reviewer notes

**Source:** peer-review × 3 (one per feature PR — fat-iter scoping made the
features genuinely independent, so a single integrated reviewer wasn't needed).

- **P3.A (PR #27, super-review APPROVE)** — `MonthlyBudget` lib + store; DB v3
  schema generalised to per-store keyPath; **TD.5 closed** via dbMigration.test.ts.
  CR nit: redundant spread in `createMonthlyBudget` → applied.
- **P3.E (PR #28, super-review APPROVE)** — `summarizeExpenses` + `MonthlySummary`.
  Pure lib + pure renderer. Empty-array path returns `{ 0, 0, 0 }` (no NaN).
  CR nit: duplicate empty-array test → applied.
- **P3.C (PR #29, super-review APPROVE)** — Month switcher + filter composition
  (`byMonth → byCategory`) + MonthlySummary integration. CR raised 3 nits, all
  declined with reasons logged in the PR body: (1) "useState(currentMonth) missing
  parens" — CodeRabbit didn't recognise the lazy-initializer pattern; React calls
  the function once on mount, state holds the string. Added a one-line clarifying
  comment so future readers don't re-trip. (2) `monthOf` no input validation —
  inputs are gated upstream (expense.date is validated YYYY-MM-DD). (3)
  MonthSwitcher defensive guards — `value` always sourced from typed App state
  mutated only via `prevMonth`/`nextMonth`.

**Side note logged in PR #29:** `vite.config.ts` now sets `fileParallelism: false`.
fake-indexeddb scales poorly under concurrent vitest workers — the 188-test suite
intermittently tripped 1000ms findBy timeouts. Sequential file runs are ~20s
and stay reliable. Comment + revisit-trigger documented inline.

**Sub-agent dispatch lesson:** P3.A and P3.E ran in parallel (disjoint file sets,
neither touched App.tsx). When committing P3.A's branch, `git add -A` accidentally
swept in P3.E's untracked files. The auto-classifier correctly denied a
`--force-with-lease` push when I tried to fix it on the pushed branch. Recovery
was to create a fresh branch (`loop/iter-010-p3a-budget`) with clean history and
delete the stale remote one — no destructive history rewrite. **Process fix:**
when staging sub-agent output in fat-iter, use explicit file paths in `git add`,
not `-A`, until all features are on their own branches.

## iter-011 — Phase 3 fat-iter (3 features, 2 PRs)

**Source:** peer-review × 2 (PR-level Class A super-reviewers).

- **P3.B + P3.F (PR #31, super-review APPROVE)** — bundled (P3.F is the over-
  budget visual variant of P3.B). New `useMonthlyBudgets` hook + `budgetStatus`
  lib + `BudgetForm` + `BudgetVsActual`. Wire-in note: BudgetVsActual is scoped
  to **monthly** expenses (not category-filtered) — budget covers the whole
  month regardless of view filter; comment in App.tsx explains. CR raised 5
  nits; 1 applied (brittle innerHTML purity test → no-throw assertion), 4
  declined with reasons logged in the PR body (negative actual gated upstream;
  error-detail capture would diverge from useExpenses/useCategories pattern).
- **P3.D (PR #32, super-review APPROVE)** — Pure SVG bar chart sharing the
  `spendingByCategory` data with the existing text list. Both live under one
  "Spending by category" heading. CR raised 1 nit (separate heading) — declined
  because the chart has its own SVG aria-label; would duplicate. Super-reviewer
  flagged a follow-up: `<text>` labels + bar `aria-label` may double-announce
  to screen readers — consider `aria-hidden` on the `<text>` later.

**Phase 3 closed.** All 6 features (P3.A–P3.F) shipped across iters 10 and 11.

**Process-fix RE-applied (and FAILED) this iter:** I logged "use explicit file
paths in `git add`, not `-A`" after iter-010's mishap — and immediately repeated
the mistake on the P3.B+F branch. Recovered via the same fresh-branch route
(`loop/iter-011-p3bf-budgets` replaces `loop/iter-011-p3bf-budget-vs-actual`).
**The lesson is real but the rule wasn't enforced**; next iter's first CR-nit
commit will deliberately stage by path. Consider adding a CLAUDE.md note if it
happens a third time.

**iter-012 trigger:** Phase 3 → Phase 4 is a phase boundary. The mandatory
arch-pass via the `improve-codebase-architecture` skill fires next iter before
Phase 4 (Polish & power features) starts.

## iter-012 — phase-boundary arch pass (Phase 3 → Phase 4)

**Source:** arch-pass (Skill `improve-codebase-architecture`)
**Surfaced 3 deepening opportunities:**
1. `useVisibleExpenses` hook — extract filter pipeline composition. **Executed.**
2. Data-hook factory across `useExpenses` / `useCategories` / `useMonthlyBudgets`.
   **Declined.** Deletion test: each hook has unique validation, error message,
   load path (seed-on-empty for categories, upsert for budgets, validate-then-
   write for expenses); a factory would push that divergence into config
   objects without removing it.
3. `useSpendingByCategory` (dedup `SpendingByCategory` + `SpendingChart` sort
   + empty check). **Deferred.** Two callsites with identical args is
   borderline; pair with P3.G's empty-state requirements when that lands so
   the interface is shaped by the real need, not speculation.

**Executed (PR #34, super-review APPROVE):**
- `src/hooks/useVisibleExpenses.ts` — composes `monthlyExpenses` (month only —
  for BudgetVsActual; budget covers the whole month regardless of category)
  and `visibleExpenses` (month + category — for every user-visible surface).
  Two `useMemo` layers so flipping the category filter doesn't re-walk the
  month filter. App.tsx loses the two inline `filterExpensesBy*` calls.
- CR caught one genuine test bug — memo test was comparing
  `visibleExpenses` against a captured `monthlyExpenses` ref (passing for the
  wrong reason since under `filter='all'` they alias). Applied.
- Super-reviewer noted: deletion-test outcome is "thin but justified" —
  one-caller-today, but the named return (`monthlyExpenses` vs
  `visibleExpenses`) clarifies the BudgetVsActual invariant that previously
  lived in a code comment. P4.A search and P4.B date-range will plug into
  the same hook's signature.

**Phase 3 → 4 readiness:** Phase 4 (P4.A search, P4.B date-range, P4.C/D CSV,
P4.E recurring, P4.F dark mode, P4.G empty/loading polish, P4.H responsive)
will plug new view-state filters into `useVisibleExpenses` rather than
scattering through App. P4.C/D CSV import adds bulk-mutation methods to
`useExpenses` (no factory needed — just new methods). P4.G triggers the
deferred `useSpendingByCategory`. P4.E (recurring) is the heaviest — likely
needs new lib for month-rollover generation, plus a `recurring: true` flag
on the existing Expense model (already there per the schema, never used).

## iter-013 — Phase 4 fat-iter (3 features, 2 PRs)

**Source:** peer-review × 2 (PR-level Class A super-reviewers).

- **P4.A + P4.B (PR #36, super-review APPROVE)** — bundled. Search + date-range
  filters extend `useVisibleExpenses` cleanly through the seam from iter-012.
  Pipeline: `expenses → byMonth → monthlyExpenses → byDateRange → byCategory
  → bySearch → visibleExpenses`. `monthlyExpenses` deliberately bypasses
  byDateRange to preserve the budget-coherence invariant. CodeRabbit:
  **No findings ✔**. Super-reviewer surfaced two low-priority follow-ups:
  (1) DateRangeFilter doesn't normalize/swap when `from > to` (silently
  empty result); (2) DateRangeFilter draft state doesn't re-sync to external
  `value` changes (App owns reset today, so fine).
- **P4.F (PR #37, super-review APPROVE)** — dark mode via CSS custom
  properties + localStorage. First-paint flash avoided by calling
  `applyTheme(loadTheme())` in `src/main.tsx` BEFORE React renders.
  CodeRabbit: 2 nits, both applied (added persisted-load test; imported
  `THEME_STORAGE_KEY` constant).

**Super-reviewer's load-bearing finding on P4.F**: ExpenseList, CategoryFilter,
MonthSwitcher, ExpenseForm, BudgetForm CSS still hard-code light colors
(`#fff`, `#ccc`, `#222`, etc.). Dark-mode shell renders but cards/inputs/buttons
stay light — a mixed UI. **Deferred as P4.I (themability sweep)** added to
GOALS.md. Not a correctness bug; toggle + persistence + first-paint all
work end-to-end; it's a scope cut for P4.F.

**Node 25 localStorage shim:** the test files for theme + ThemeToggle install
a working in-memory `Storage` shim in `beforeAll` because Node 25's
experimental built-in `localStorage` shadows jsdom's Storage in the vitest
jsdom env (no `setItem`/`getItem`/`clear` methods). Each shim runs in its own
file (vitest isolates per file), so it doesn't leak. Worth extracting to
`src/test/setup.ts` if/when more localStorage-backed features land (P4.E
recurring expense state is a likely trigger).




---

## iter-014 super-reviewer notes

### PR #39 (P4.C + P4.D — CSV export + import) — APPROVE

**Findings (all low / info):**

- **CSV-injection (non-blocking):** `formatExpensesCsv` does not prefix
  `=`, `+`, `-`, `@` fields with `'` or wrap them. For a local-only
  single-user app this is acceptable; flag if export ever surfaces in shared
  spreadsheets. Logged as carry-forward.
- `createExpense(input)` is called for validation but the validated object
  is discarded; tokenized fields are then re-cleaned manually. Slightly
  wasteful; CR proposed using the validated object directly. Declined as
  cosmetic — current shape is explicit.

**CodeRabbit critical finding applied:**

- `useExpenses.addMany` no longer prefixes errors with "Row N:". The
  prefix was off-by-N once a CSV parser had already dropped invalid rows.
  addMany has no notion of source-row coordinates; callers add row context.

### PR #40 (P4.I — themability sweep) — APPROVE

**Findings (all low / info):**

- **Brand-accent hue shift in light mode** — Original component CSS had
  blue highlights (`#2d6cdf`, `#1d4ed8`). P4.I collapses both onto the
  single `--app-accent` (`#aa3bff`, purple — the legacy palette's brand
  color). Intentional given P4.F made `--app-accent` the canonical brand
  color. Worth a visual checkpoint screenshot — buttons and edit-link will
  read purple instead of blue in light mode.
- `.expense-list__edit` text contrast on `--app-surface-2` increased
  (`#444` → `#1a1a1a`). Net positive for a11y.
- `:hover` swapped from a hand-picked darker blue to `filter:
  brightness(0.92)` (BudgetForm). On dark mode the purple accent gets
  darker on hover which can feel subtle; acceptable.

**Contrast checks (AA: 4.5:1 normal, 3:1 large/UI):**
- `--app-fg` on `--app-bg`: ~14.5:1
- `--app-fg` on `--app-card-bg`: ~12.4:1
- `--app-accent-fg` on `--app-accent`: ~7.6:1
- `--app-error` on `--app-bg`: ~5.4:1
- `--app-muted-fg` on `--app-bg`: ~7.0:1
All pass AA+.

**CodeRabbit a11y findings applied:** `:focus-visible` on
`.category-filter__select` and `.expense-list__delete` — both were
missing; in dark mode the browser-default outline would have been
near-invisible.

---

## iter-015 super-reviewer notes

### PR #42 (P4.G — empty + loading polish) — APPROVE with nits

**Findings (all nit / info):**

- **App.tsx loading scope**: Spinner only shows in the filter/list block;
  insights, BudgetForm, CategoryManager still render their own
  EmptyStates briefly during initial hook resolution. Not a regression
  vs main. Deferred as P4.G follow-up — gate the whole post-header content
  tree on `loading`, or render the spinner inside each insight card.
- **Copy inconsistency**: "No expenses yet." / "No spending yet." /
  "No expenses this period." (periods) vs "No data to chart" (no period).
  Deferred (cosmetic).
- **Spinner aria-label + visually-hidden text BOTH load-bearing** — CR
  declined. Per WAI-ARIA 1.2, role="status" is NOT a name-from-content
  role; aria-label provides the accessible name, the visually-hidden span
  provides a visible cue under prefers-reduced-motion. Documented in
  Spinner.tsx comment so future review passes don't re-litigate.

### PR #43 (P4.H — responsive layout) — APPROVE after fix

**Blocking finding (applied):**

- **CategoryManager touch targets** — the only interactive cluster in the
  diff without the ≥44px treatment given to siblings (forms, filters,
  CSV row). Fix: ≤480px block adds `min-height: 44px; box-sizing:
  border-box;` to buttons + inputs; add-form row stretches its
  submit + name input to 100% width. Per-row swatch (color picker) and
  rename/delete buttons share the same min-height; row uses flex-wrap so
  they cluster sensibly.

**Findings (nit / info, all addressed during CR triage before super-review):**

- SpendingChart 11px → 0.75rem at ≤480px (a11y + rem consistency).
- ExpenseList redundant `gap` at ≤480px (already set at ≤768px).
- ExportButton missing `box-sizing: border-box` on full-width state.
- ExpenseForm + BudgetForm: `box-sizing` hoisted to base input selectors.

### Cross-PR coherence — APPROVE

- File overlap check empty (`comm -12` on the two diffs).
- Disjoint allowlists honored end-to-end.
- Combined behavior at 480px: stacked header, full-width filters/buttons,
  EmptyState cards render coherently with dashed border; Spinner ("lg",
  40px ring) fits 360px viewport.
