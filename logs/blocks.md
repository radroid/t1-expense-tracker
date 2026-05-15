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

---

## iter-016 super-reviewer notes (PR #45 — P4.E recurring)

**Verdict: APPROVE (high confidence)** after applying CR fixes and the
super-reviewer's prop-tightening nit.

### Findings (all nit / info)

- **App.tsx eslint-disable for react-hooks/exhaustive-deps** — super-
  reviewer flagged as unnecessary. **DECLINED**: `expensesHook.addMany`
  IS referenced inside the effect body but excluded from deps on
  purpose (addMany is a stable hook method reference; adding it would
  be noise). The disable is load-bearing. Misleading comment was tweaked
  but the directive stays.
- **`dueTemplatesForMonth` uses `e.date.slice(0, 7)` for month match** —
  super-reviewer flagged as theoretical risk if a malformed date sneaks
  in. **DEFERRED**: `createExpense` enforces YYYY-MM-DD via DATE_RE +
  real-calendar check. No live path would produce a malformed date.
- **`onDelete` prop type tightened** to `Promise<boolean>` to mirror
  `onAdd`. **APPLIED** in commit 29bd6b5. Type-only change at the seam;
  hook already returned `Promise<boolean>`.

### Strengths called out

- DB migration test covers BOTH v2→v4 and v3→v4 paths with seeded data
  for expenses + budgets (the rubric's survival check).
- Idempotency model is clean: sourceTemplateId-keyed match + month-slice
  filter; dedicated negation tests for different-template-id, no-
  template-id, and other-month cases.
- Rollover effect guard correct: both `loading` flags short-circuit at
  the top; dep array includes `expensesHook.expenses` so post-addMany
  re-fire observes the new expense and the next `due` is empty — no
  infinite loop.
- `applyExpenseEdit` mirrors `categoryId` semantics for
  `sourceTemplateId`, including the "explicit undefined ≡ omission"
  branch — three targeted tests prove it.
- `dayOfMonth` capped at 28 in lib (not just UI): `generateDueExpenses`
  can never construct an invalid ISO date.
- `onAdd` returns `Promise<boolean>` and the form only clears on success
  — explicit test for the failure path preserves input. (Came from CR
  triage during this iter.)
- Hook shape matches `useMonthlyBudgets`/`useCategories` exactly; error
  clears on success.
- No incidental edits to budget pipeline, CSV, theming, or responsive
  surfaces — diff is tightly scoped to P4.E.

## Phase 4 closed — iter-017 = MANDATORY ARCH PASS

iter-017 MUST start with the `improve-codebase-architecture` skill
invocation (real tool call, not a concept). Result MUST be logged here
with `**Source:** arch-pass`. This is a hard rule from the loop protocol.

---

## iter-017 — Phase-4 → Phase-5 arch pass

**Source:** arch-pass (mandatory phase-boundary; `improve-codebase-architecture` skill invoked).

The Explore agent walked the codebase organically and surfaced five
deepening opportunities. Recommendation: pick #1 (`useStoredCollection<T>`)
for iter-018; bundle #2 (error-messages map) into the same PR if scope
allows; defer #3, #4, #5.

### Candidate #1 — Generic `useStoredCollection<T, TInput>` hook  [PICKED FOR iter-018]

**Files:** `src/hooks/useExpenses.ts`, `useCategories.ts`,
`useMonthlyBudgets.ts`, `useRecurringTemplates.ts`.

All four hooks follow identical shape: `useState({ items, loading, error })`
+ `useEffect` load + async mutation orchestration (validate → store write
→ refresh → set last-error string). Methods return `Promise<boolean>`;
error clears on success. The pattern is **deep enough to earn extraction**
(it orchestrates three concerns: validation, persistence, refresh) but
currently smeared across four files.

**Deletion test:** Deleting the generic would force all four hooks to
re-expand. Complexity concentrates in one place rather than smeared
across N callers. ✓ Worth it.

**Risk:** Over-fitting if future hooks diverge (optimistic updates,
partial refresh). Mitigation: design for composition, not universality
— generic handles the baseline; domain hooks layer specifics (e.g.
`useCategories.rename`) on top.

**Test impact:** Coverage equal-or-improves — testing the generic
surface once beats testing the same pattern four times.

### Candidate #2 — `src/lib/errorMessages.ts` map  [BUNDLE INTO #1 IF SCOPE ALLOWS]

12+ "Failed to load/add/save/delete X." strings hardcoded across hooks.
Hygiene lift, not architectural — but lifts compound. Single source of
truth for UX copy, single place to retune voice.

**Deletion test:** Deleting it just pushes strings back. Not a deep
seam. Skip if iter-018 scope is tight.

### Candidate #3 — Generic `makeStore<T>(storeName, options?)` factory

**Files:** `src/db/expenseStore.ts`, `categoryStore.ts`, `budgetStore.ts`,
`recurringTemplateStore.ts`.

Each wraps `withStore` identically (add/getAll/update/remove + a couple
of domain helpers — categoryStore has `seedDefaultCategories`, budgetStore
keys by `month` instead of `id`). The CRUD layer is uniform; the
specifics earn their domain modules.

**Deletion test:** Concentrates IDB boilerplate. ✓ Worth it.

**Defer rationale:** pairs naturally with #1 (refactor stores at the same
time as hooks if the hook generic exposes the store seam clearly), but
adds review surface. Sequencing: ship #1 first; revisit #3 after the
hook generic is stable.

### Candidate #4 — Pure `src/lib/expenseVisibility.ts` pipeline

`useVisibleExpenses` chains 4 memoized filter stages + a budget-coherence
carveout (`monthlyExpenses` bypasses date-range). The hook is "5
`useMemo` calls and pass intermediate results"; the pipeline could live
in `src/lib/` as a pure function that the hook wraps in a single
`useMemo`.

**Deletion test:** Marginal. The hook IS already thin — it composes
existing pure filters from `src/lib/expenseFilter.ts`. Lifting the
orchestration as well would unlock standalone use (CSV without UI, etc.)
but no current consumer demands it.

**Defer rationale:** No active need. Revisit if a non-React consumer
appears.

### Candidate #5 — Drop vestigial `Expense.recurring?: boolean`

Field is now unused — superseded by `sourceTemplateId` + RecurringTemplate
in iter-016. Kept to avoid touching persisted records. IDB is
schema-less, so leaving the type narrows is safe; first edit on any
historical record drops it via `applyExpenseEdit`'s cleaning.

**Defer rationale:** Low value, low urgency. Pair with a future DB
cleanup iter.

### Decision summary

| # | Title | Priority | Target iter | Status |
|---|---|---|---|---|
| 1 | `useStoredCollection<T>` | HIGH | iter-018 | TD.7 (open) |
| 2 | `errorMessages.ts` map | LOW | iter-018 (bundle) | TD.8 (open) |
| 3 | `makeStore<T>` factory | MEDIUM | post-iter-018 | TD.9 (open) |
| 4 | `expenseVisibility.ts` pipeline | DEFERRED | when 2nd consumer lands | TD.10 (open) |
| 5 | drop vestigial `recurring` | DEFERRED | DB cleanup iter | TD.11 (open) |

iter-018 is a single-feature impl iter shipping TD.7 (+ TD.8 if scope
permits). The arch-pass itself produces no code changes — only this
log entry, GOALS.md TD additions, and the iter-017 closeout PR.

---

## iter-018 super-reviewer notes (PR #48 — TD.7 + TD.8)

**Verdict: APPROVE (high confidence).**

### Verified

- **TD.12 holds**: `git show main:src/hooks/useExpenses.ts` confirmed the
  OLD hook used the same `try { await store.X; setItems(await getAll()) }
  catch { setError(failureMsg) }` pattern. Refactor preserves pre-existing
  behavior. CR's 4 MAJOR findings are pre-existing TD, correctly deferred.
- **Behavior parity** on 3 representative paths: valid input → returns
  true + refreshes + clears error; invalid input → domain validator
  message surfaces; store-failure → exact `messages.add` (`"Failed to add
  expense."`).
- **errorMessages strings**: verbatim match against `git show main:src/
  hooks/use*.ts | grep "Failed to"` for all four hooks.
- **`Object.isFrozen`** asserted for all four bundles.
- **Store closure wrapping** verified in all four wrappers — vi.spyOn
  compatibility preserved.
- **Field aliases** (`expenses`/`categories`/`budgets`/`templates` →
  `items`) returned by every wrapper; App.tsx untouched.
- **No `*.test.ts` files modified** (only new test files added) — test-
  preservation contract satisfied.

### Findings (all info; no action required)

- `useCategories.bootstrap`: discards `seedDefaultCategories`'s return
  and the generic re-runs `getAllCategories` after. One redundant
  round-trip on first mount vs old hook. Pure perf nit; behavior and
  tests unaffected.
- `useStoredCollection`'s optional-update fallback branch
  (`messages.update ?? messages.add`) is unreachable from production
  callers (budgets/templates wrappers don't expose `update` on their
  public types) but tested as defense-in-depth.
- `eslint-disable react-hooks/exhaustive-deps` on the load effect has a
  5-line comment explaining the load-once intent.

### Strengths

- Clean separation: generic owns the {validate → write → refresh} shape;
  wrappers own only domain-flavored surface (`set`, `rename`, `addMany`).
  Each wrapper file shrank ~30-40%.
- The two escape hatches (`setError`, `refresh`) are minimal and
  well-justified by `addMany`'s bulk-summary flow.
- Inline comments explain *why* (closures vs direct refs for spy compat;
  exhaustive-deps suppression; bootstrap-then-getAll ordering; optional-
  update fallback) — high signal-to-noise.
- 15 new tests on the generic + 5 frozen/string-pinning tests give a
  strong contract anchor without polluting domain test files.

---

## iter-019 super-reviewer notes (PR #50 — P5.A + P5.B)

**Verdict: APPROVE (high confidence).**

### Verified

- **Round-trip purity** on `urlFilters`: `parseFilters(serializeFilters(state))`
  recovers all fields for full state; minimal state round-trips through
  the documented "omit defaults" path.
- **Lazy-init pattern** in App.tsx: `parseFilters(...)` is called once
  per render but consumed only on first render via `useState`. Pure
  string parse; cost negligible.
- **Write effect deps** correct: `[selectedMonth, filter, searchTerm,
  dateRange]`. Uses `replaceState` (keeps back stack clean).
- **CR's MAJOR fix applied**: `replaceState` clear target is now
  `${pathname}${search}` not a literal space.
- **Hash reset in App.test beforeEach** unblocked 6 pre-existing tests
  that were failing because jsdom's `location` outlives a single test.
- **`BACKUP_SCHEMA_VERSION === 1`** exported + asserted.
- **Snapshot shape** in declared key order (positional substring assert
  in tests).
- **Determinism** via injectable `now`.
- **JSON pretty-print** + round-trip via `JSON.parse`.
- **BackupExport** mirrors ExportButton's Blob/anchor/click/revoke pattern.
- **Empty data** still produces a valid download (no disabled state).
- **App.tsx wiring**: `BackupExport` receives all four arrays;
  field names align with `BackupExportProps`.
- **No infinite-loop risk** from URL-driven month changes triggering
  rollover — `dueTemplatesForMonth` dedupe via `sourceTemplateId` keeps
  the next-tick `due` empty.

### Findings (all nit / info — no action this iter)

1. `parseFilters` runs on every render even though only the first uses
   it. `useState(() => parseFilters(...))` callback form would be
   crisper. Negligible cost; non-blocking.
2. `urlFilters` parser accepts `cat=all` as `filter: 'all'`, while the
   serializer omits `cat=all`. Asymmetric but harmless (default).
   Worth a comment if it confuses a future maintainer.
3. `BackupExport.todayIsoDate` uses local-time YYYY-MM-DD; `exportedAt`
   inside the snapshot is UTC ISO. Possible 1-day skew near midnight
   UTC for negative-timezone users. Filename is cosmetic.

### Strengths

- Pure libs with injectable `now`; tests cover round-trip + edge cases
  (special chars, partial date range, both-invalid).
- BackupExport mirrors a well-tested existing component (ExportButton)
  rather than inventing a new download pattern.
- Key-order determinism for the JSON snapshot uses position-aware
  substring asserts — more robust than `JSON.parse`-and-compare for
  intent verification.
- CR's MAJOR finding was caught + remediated during the same iter; the
  fix preserves base URL on clear instead of leaving a literal space.

---

## iter-020 super-reviewer notes (PR #52 — P5.C JSON backup restore)

**Verdict: APPROVE (high confidence).**

### Verified

- **Atomicity is correct**: a single `db.transaction([...STORES],
  'readwrite')` issues all `clear()` + `add()` calls synchronously
  inside the executor, with the await pinned to
  `oncomplete`/`onerror`/`onabort`. No `await` interleaves between
  requests — the auto-commit hazard is avoided.
- **Synchronous-throw rollback is real and tested**: the `[null]`
  injection in `restoreBackup.test.ts` exercises the catch → `tx.abort()`
  path; seeded pre-restore data survives across all four stores.
- **`parseBackup` orders checks correctly**: shape → number-typed
  `schemaVersion` → exact-equality version match → `exportedAt`
  string → four array fields. The "schemaVersion missing" case is
  steered to `invalid-shape` (not `unsupported-schema-version`).
- **jsdom fallback is feature-detected at call site**, not globally
  monkey-patched. Production retains real `showModal`/`close`
  semantics including `::backdrop`.
- **App.tsx integration uses `Promise.allSettled`** — a transient
  refresh failure won't be misreported as "Restore failed", which is
  the correct policy given the DB write has already committed
  atomically.
- **Hook `refresh()` additions are pure one-line passthroughs** of the
  pre-existing `useStoredCollection.refresh` escape hatch
  (iter-018). No behavior change to existing call sites; existing
  hook tests untouched.

### Findings (all nit / info — no action)

1. `restoreBackup.ts:32`: `tx.onerror` and `tx.onabort` both call
   `reject(...)`. On a synchronous catch path the inner `reject(err)`
   fires first, then `tx.abort()` triggers the abort handler which
   re-rejects. Harmless (Promise resolves once) but worth a one-line
   comment that duplicate rejections are intentionally swallowed.
2. `BackupRestore.tsx:113`: `onRestore` is typed
   `() => Promise<boolean>`; the "refresh failed" branch is currently
   unreachable because the integrator uses `Promise.allSettled` and
   always returns `true`. Not a defect — keeps the contract honest
   for future callers.
3. `parseBackup.ts:78`: array-field check doesn't distinguish
   missing-vs-wrong-type in the error message (both surface as "must
   be an array"). Spec only requires three reasons. Consider a
   "missing" message variant later for nicer UX.

### Strengths

- Atomicity contract is testably proven (rollback test) and matches
  the documented behavior of IDB multi-store transactions.
- jsdom-vs-production parity for the `<dialog>` element is handled
  surgically — feature-detect at call site, tests assert via
  `hasAttribute('open')` to stay agnostic.
- A11y: `role="alert"` for parse/restore errors, `role="status"` for
  "Restored.", 44px touch targets, `::backdrop` styling for the
  destructive confirmation.
- File picker resets between operations (`resetFileInput()` on every
  change) so re-selecting the same file re-fires onChange — a real
  UX trap avoided.

---

## iter-021 super-reviewer notes (PR #54 — P5.D per-category budgets)

**Verdict: APPROVE (high confidence).**

### Verified

- **Composite-format locality**: grep confirms `categoryBudgetId(...)` is
  the ONLY site that builds `${month}|${categoryId}` across `src/`.
  Future format change is a one-file edit.
- **CR's MAJOR fix applied**: `createCategoryBudget` trims `categoryId`
  ONCE into `normalizedCategoryId` and reuses it for both the row
  field and id derivation. Whitespace variants collapse to one row.
- **Validation mirrors `MonthlyBudget`**: same MONTH_RE, finite>0
  amount, throwing factory. Bad-month / empty-categoryId /
  zero/negative/NaN/Infinity tests cover it.
- **Hook binds `useStoredCollection`** with frozen
  `categoryBudgetMessages` from `errorMessages.ts`. No re-rolled CRUD.
- **`setCategoryBudget` is `put`** (upsert), not `add`. Composite-key
  put behaves like `useMonthlyBudgets.set` → `setBudget`.
- **`DB_VERSION === 5`** + `categoryBudgets` in `STORES`. Existing
  upgrade loop creates the new store on each upgrade tick.
- **v4 → v5 migration test**: seeds expense + recurringTemplate at v4,
  reopens at v5, asserts both survive AND `categoryBudgets` exists
  AND a row round-trips.
- **Backup schemaVersion 1 → 2**: `BACKUP_SCHEMA_VERSION === 2`
  exported + asserted. v1 snapshots → `unsupported-schema-version`
  (NOT silent-pass — explicit test).
- **Backup pipeline**: BackupSnapshot + buildBackup + parseBackup +
  restoreBackup + BackupExport all carry `categoryBudgets`. Format
  key order preserved. STORES tuple in restoreBackup covers all 5
  stores; rollback test extended to confirm pre-restore
  `categoryBudgets` survive a null-in-categoryBudgets abort.
- **`<BackupRestore>` confirmation copy** enumerates per-category
  budgets in the destructive warning + counts row.
- **`<CategoryBudgetManager>` wired in App.tsx**; placement next to
  `<RecurringManager>` / `<BudgetForm>`. No regression in budget
  pipeline — `<BudgetVsActual>` still operates on `monthlyExpenses`.
- **A11y**: inputs/buttons have per-category aria-labels
  ("Budget for X", "Save budget for X", "Remove budget for X");
  swatch is `aria-hidden`. Validation errors are `role="alert"`.
- **Out-of-allowlist edit was TS-forced**: `BackupRestore.test.tsx`
  snapshot helper added `categoryBudgets: []` — required by the
  BackupSnapshot type change; behaviorally inert.

### Findings (all nit / info — no action this iter)

1. `restoreBackup.ts` header comment still reads "Replaces all four
   stores" while the tuple now covers five. Cosmetic doc lag.
2. `useCategoryBudgets.getFor` does a linear `items.find`. Fine at
   current scale; swap to a memoized `Map` keyed by composite id if N
   grows.
3. `<CategoryBudgetManager>` has no `role="status"` success channel —
   silent save. Acceptable for v1; consider adding a "Saved" toast if
   user feedback requests it.

### Strengths

- `categoryBudgetId` as a single composite-format site is exactly the
  "interface-as-test-surface" pattern from iter-017's arch glossary.
  Should this domain ever need a different key shape, one file moves.
- Backup schemaVersion bump is correctly *breaking* — silent v1 load
  would lose `categoryBudgets`; explicit rejection forces a user
  conversation rather than silent data loss.
- Domain wraps `useStoredCollection` with the smallest possible
  surface (set + remove + getFor + refresh); no new CRUD primitives
  invented.

---

## iter-022 super-reviewer notes (PR #56 — P5.E multi-currency)

**Verdict: APPROVE (high confidence).** Phase 5 closer.

### Verified

- **Forbidden-file audit clean**: diff against `src/lib/expense.ts`,
  `src/lib/csv.ts`, `src/lib/backup.ts`, `src/db/` is empty.
  `DB_VERSION === 5` and `BACKUP_SCHEMA_VERSION === 2` unchanged.
- **`useCurrency`** uses `useState` lazy initializer (no SSR/effect
  race on first paint). `setCurrency` is `useCallback`-memoized.
- **`formatterCache`** keyed by `CurrencyCode` (4 entries max). Locale
  pinned to `'en-US'`; thousands-separator test across all four codes.
- **JPY zero-fraction-digit path**: `formatterFor` sets
  `minimumFractionDigits: 0, maximumFractionDigits: 0` for JPY,
  `2,2` for the rest. No hard-coded `2` leak.
- **Defensive try/catch tests**: `vi.spyOn(Storage.prototype,
  'getItem'|'setItem').mockImplementation(() => { throw ... })`
  drives the catch branches. `loadCurrency` returns `'USD'` on
  read-throw; `saveCurrency` swallows write-throw.
- **`isCurrencyCode`** covers all 4 positive cases + `'XYZ'`/`''`/case
  mismatch + `null`/`undefined`/number/object negatives.
- **`<CurrencySelector>`**: `useId`-bound `<label htmlFor>`,
  belt-and-braces `isCurrencyCode` guard in the change handler,
  `--app-*` tokens, `min-height: 44px` on wrapper + select, mobile
  `≤480px` breakpoint full-width.
- **App.test integration**: localStorage seeded `'EUR'` boots
  RunningTotal as `€10.00`; switching to `'JPY'` via the selector
  flips to `¥100` (no decimals) AND persists `'JPY'` back to
  localStorage — full hook+selector+formatter loop end-to-end.
- **All 6 consumers receive `currency: CurrencyCode`** and route
  through `formatCurrency`. App.tsx owns `useCurrency()`. Grep
  confirms no shipping `formatUSD` callers remain (shim used only by
  its own pinned tests).
- **Test infra consolidated**: `src/test/setup.ts` owns the Node-25
  Storage shim + a global `afterEach(localStorage.clear())`.
  Per-file shims removed from `theme.test.ts` + `ThemeToggle.test.tsx`.

### Findings (all nit / info — no action)

1. `MonthlySummary.test.tsx:31` + `SpendingChart.test.tsx:88` test
   descriptions still say "with formatUSD" / "via formatUSD" while
   bodies now exercise `formatCurrency(amount, 'USD')`. Cosmetic;
   assertions correct. Rename in a follow-up.
2. `formatUSD` shim is exported, used only by its own pinned tests.
   Grep confirms zero shipping callers. Safe to drop in a later iter.

### Strengths

- **Phase 5 closes cleanly.** Five features landed across five iters
  (iter-019/020/021/022 covered them, with the arch pass at iter-017
  setting up the hook seam that all four storage-backed Phase 5
  features used).
- The currency seam mirrors the theme seam exactly — same
  load/save/key pattern, same try/catch fallback, same shape of
  storage hook. Future "preference" additions can copy the pattern
  without thought.
- The localStorage shim centralisation finally landed — a
  long-running carry-forward that was always blocked on "wait for a
  second consumer". `useCurrency` was that consumer.
- Prop drilling over Context was the right call for 6 sites of depth
  ≤2 — no provider indirection added.

## Phase 5 closed → iter-023 = MANDATORY ARCH PASS

iter-023 MUST start with the `improve-codebase-architecture` skill
invocation (real tool call, not a concept). Result MUST be logged
here with `**Source:** arch-pass`. This is a hard rule from the loop
protocol.

---

## iter-023 — Phase-5 → Phase-6 arch pass

**Source:** arch-pass (mandatory phase-boundary; `improve-codebase-architecture` skill invoked on entry).

The Explore agent walked the codebase organically: 5 store files, the
3-file backup pipeline, useStoredCollection + 5 consumers,
useVisibleExpenses, currency.ts (incl. formatUSD shim), and
Expense.recurring vestige. Six candidates surfaced; three pickups
recommended for iter-024.

### Candidate #1 — `makeStore<T, K>` factory  [PICKED for iter-024]

**Files:** `expenseStore.ts`, `categoryStore.ts`, `budgetStore.ts`,
`recurringTemplateStore.ts`, `categoryBudgetStore.ts`, `db.ts`.

Five stores follow an identical template: `STORE_NAME` constant +
4 CRUD wrappers around `withStore()`. Only `categoryStore.ts` earns
its file via `seedDefaultCategories()`. The rest are pass-throughs.

**Deletion test:** A single `makeStore<T, K>(name)` factory
returning `{ add, getAll, update, remove }`. Domain helpers
(`seedDefaultCategories`, composite-key plumbing) stay in their
domain modules. Complexity concentrates in the factory.

**Risk:** Future IDB-specific helpers (range queries, compound
indices) would need escape hatches. Low today.

**Status:** TD.9 (carried since iter-017; sequencing constraint
"after useStoredCollection stabilizes" cleared 5 iters ago).
**Pick for iter-024.**

### Candidate #2 — `makeDownloadBlob` / download seam  [DEFER]

**Files:** `ExportButton.tsx`, `BackupExport.tsx`.

Both components duplicate the Blob+anchor+revoke dance. Six lines
each; only filename + MIME differ. Lifting now is real but small.

**Risk:** Premature without a third consumer. Defer until P6 lands
a PDF/zip/etc. export and gives us 3 adapters.

**Status:** **TD.13 (NEW)** — defer.

### Candidate #3 — `useFileRestoreFlow` hook  [DEFER]

**Files:** `ImportButton.tsx`, `BackupRestore.tsx`.

File-picker + parse + optional confirmation + execute. The dialog
path only `BackupRestore` uses. Hook would need a "no dialog"
mode for ImportButton — knob, not a problem, but adds weight.

**Risk:** Over-engineering if only one consumer needs the dialog
branch. Defer until a 3rd consumer commits (e.g. bulk-replace CSV
import).

**Status:** **TD.14 (NEW)** — defer.

### Candidate #4 — Delete `formatUSD` shim  [PICKED for iter-024]

**Files:** `currency.ts`, currency.test.ts.

Zero shipping callers as of P5.E. Shim was kept as a migration
bridge; that work is done. Stale test descriptions in
MonthlySummary.test.tsx + SpendingChart.test.tsx still reference
"formatUSD" but bodies use formatCurrency.

**Deletion test:** Zero complexity relocates. Pure subtraction.

**Status:** **TD.16 (NEW)** — picked. Pair with TD.9 + TD.11 as
"cleanup week".

### Candidate #5 — Drop `Expense.recurring?: boolean`  [PICKED for iter-024]

**Files:** `expense.ts`, `csv.ts`, `csv.test.ts`, `expense.test.ts`.

Vestigial since P4.E (iter-016). `sourceTemplateId` superseded it.
IDB is schema-less; persisted records keep the field as inert
property; first `applyExpenseEdit` drops it via clean-shape.

**Deletion test:** Removes ~5 test assertions, simplifies
applyExpenseEdit's preservation branch.

**Risk:** None. CSV readers ignore missing field; writers omit.

**Status:** TD.11 (carried since iter-017). **Pick for iter-024.**

### Candidate #6 — `backupPipeline.ts` barrel  [DEFER (or bundle)]

**Files:** `backup.ts`, `parseBackup.ts`, `restoreBackup.ts`,
`BackupExport.tsx`, `BackupRestore.tsx`.

Three lib files + two components touch the snapshot shape. A
single `backupPipeline.ts` would re-export `BackupSnapshot`,
build/format/parse + a `parseAndValidate` helper. Future
schema bumps land in one file.

**Risk:** Barrel re-exports can lightweight. Stay slim if applied.

**Status:** **TD.15 (NEW)** — defer to a backup-schema-evolution
iter, OR bundle into iter-024 if scope allows.

### Decision summary

| # | Title | Status | TD | iter-024 |
|---|---|---|---|---|
| 1 | `makeStore<T, K>` factory | OPEN since iter-017 | TD.9 | **PICK** |
| 2 | makeDownloadBlob seam | DEFER (need 3rd consumer) | TD.13 | — |
| 3 | useFileRestoreFlow hook | DEFER (need 3rd consumer) | TD.14 | — |
| 4 | Delete formatUSD shim | OPEN | TD.16 | **PICK** (pair) |
| 5 | Drop Expense.recurring | OPEN since iter-017 | TD.11 | **PICK** (pair) |
| 6 | backupPipeline barrel | OPEN | TD.15 | bundle if scope allows |

iter-024 = **cleanup-week**: TD.9 (primary refactor) + TD.11 + TD.16
(both pure subtractions). TD.15 bundles in if the diff stays small.
The arch pass itself ships no code — just this log, GOALS TD
additions, and the iter-023 closeout PR.

### Re-evaluation of iter-017 deferrals

- **TD.10 (expenseVisibility.ts pipeline)** — Phase 5 did NOT surface a
  non-React consumer (CSV export reads through component props; backup
  reads from hook items, not the pipeline). Continue deferring.
- **TD.12 (useStoredCollection refresh-after-mutation isolation)** —
  Five consumers + five iters since the refactor. No reported
  symptom; behavior preserved by design. Reopen if a real-world case
  surfaces; until then, deferring is fine.

---

## iter-024 — super-reviewer (cleanup-week TD.9 + TD.11 + TD.16)

**Verdict:** APPROVE — confidence: high.

Reviewer audited all 4 contracted invariants and found them held:

- **Public API parity (TD.9):** All 5 domain stores preserve pre-iter
  function names, argument order, return types. `add` vs `put`
  semantics correctly honored at the factory (`s.add` throws on
  conflict; `s.put` upserts) and verified by an explicit conflict
  test in `src/db/store.test.ts`. `recurringTemplateStore`
  intentionally does NOT expose `update` — matches prior surface.
- **Composite-key safety (TD.9):**
  `getCategoryBudget(month, categoryId)` still builds the composite
  via `categoryBudgetId(month, categoryId)` before `store.get`.
  Domain owns id-building; factory stays IDB-thin.
- **Forbidden-file audit (TD.11):** Zero changes to
  `src/db/restoreBackup.ts`, `src/lib/backup.ts`,
  `src/lib/parseBackup.ts`. Backup schema v2 untouched.
- **Recurring cleanup completeness (TD.11):**
  `git grep "\.recurring\b" -- src/` returns only CSS class
  selectors in `RecurringManager.css`. No `Expense.recurring`
  leftovers anywhere.
- **CSV format change (TD.11):** Header narrows to 4 cols
  `'date,amount,description,categoryId'`. All test fixtures
  migrated.
- **formatUSD removal (TD.16):** Zero matches in src/. Both
  stale test descriptions renamed.

No behavioral drift; diff is exactly the contracted pure-subtraction
/ mechanical-extraction shape. Net −150 LOC.

**Source:** super-reviewer (Class A).

---

## iter-026 — super-reviewer (fat-iter: P6.A + P6.E)

**Verdict:** APPROVE-WITH-NITS — confidence **high**.

Cross-feature integration clean. Both features verified against the
iter brief:

- **P6.A (Recurring CSV):** `RECURRING_CSV_HEADER` matches spec
  (no `frequency`); `RecurringBulkAddResult` mirrors
  `useExpenses.addMany`; empty-input fast-path tested; row-context
  preserved across parser→onImport (the P5.B off-by-N risk closed).
  CSV tokenizer duplication from `csv.ts` is explicitly
  acknowledged in-code (lift = future TD).
- **P6.E (Category-delete cascade):** pluralization correct
  (1/2/7); defense-in-depth (UI disable + App guard);
  `useCategories` stays domain-pure (no `useExpenses` import).

**Forbidden-file audit:** `src/db/db.ts`, `src/lib/csv.ts`,
`src/db/restoreBackup.ts`, `src/lib/backup.ts`,
`src/lib/parseBackup.ts`, `src/hooks/useExpenses.ts`,
`src/hooks/useStoredCollection.ts` all UNTOUCHED.

**Nit (logged as carry-forward, not a blocker):** The App-level
`handleDeleteCategory` count guard (`App.tsx:172-175`) is not
directly exercised by a test — the App test asserts the UI-layer
disable, which short-circuits the click. The guard survives only as
defense-in-depth. Captured as a follow-up TD entry.

**Source:** super-reviewer (Class A).

---

## iter-027 — super-reviewer (P6.B time-series analytics)

**Verdict:** APPROVE — confidence **high**.

Combined contract-review + forced design-review pass (UI feature
without automated visual signal). All P6.B contract guarantees
hold and are test-covered:

- `summarizeByMonth` sorts ascending YYYY-MM (lex-sort works
  because zero-padded); no zero-fills.
- `summarizeYear` always emits 12 entries Jan→Dec; other-year
  expenses excluded; bad year throws via `parseYear`.
- `<YearSwitcher>` structurally mirrors `<MonthSwitcher>`
  (role=group, aria-labels, 44px touch targets).
- `<TrendsChart>` enforces single-accent bar color via CSS
  class (not inline `fill=`) — notably cleaner than the older
  SpendingChart which still inline-fills.
- App.tsx reads from full `expensesHook.expenses` (NOT
  `visibleExpenses`) — year view stays stable as user filters
  change.

**Design-review:**
- Theme: both CSS files use only `var(--app-*)` tokens — no
  hex/rgb leaks; light + dark palettes both pass AA.
- Touch targets: YearSwitcher buttons 44×44 minimum.
- Hierarchy: `<h2>Trends</h2>` + YearSwitcher + chart reads
  cohesively. Consistent with `app__insights` pattern.
- Empty state: reuses EmptyState ("No data to chart") with
  `role="status"`.
- **Nit (non-blocking):** 12 month labels at ≤480px width get
  visually tight (font-size 10px). Future polish: alternate or
  rotate. Captured as carry-forward (P6.C a11y/responsive
  sweep covers this).

**Forbidden-file audit:** `src/db/*`, `src/lib/{csv,
recurringCsv, backup, parseBackup}.ts`,
`src/db/restoreBackup.ts` all UNTOUCHED.

**Source:** super-reviewer (Class A).

---

## iter-028 — audit + super-reviewer (P6.C a11y sweep)

**Audit:** Class A audit pass enumerated 13 P0 + 8 P1 + 8 P2
findings across all components + App.tsx. P0 cluster (14 — added
a11y-015 SearchBox to the cluster as a 1-line change) shipped this
iter. P1 form-error-association cluster (a11y-016/017/018/019)
deferred as a focused follow-up sweep. a11y-004 skip-link +
a11y-007 persistent error live region deferred as larger feature
work.

**Super-reviewer verdict:** APPROVE-WITH-NITS — confidence **high**.

All 14 P0 fixes match spec; no behavioral regressions; no
forbidden-file touches. Verified:

- Section landmarks: 5 use `aria-labelledby` + matching h2 id;
  `app__insights` uses `aria-label="Insights"` (multi-h2 inside —
  correct call). All ids unique.
- BudgetVsActual `role="progressbar"` with clamped valuenow + named
  aria-valuetext.
- BackupRestore `<dialog>` aria-labelledby + `onClose` resets
  `pending` + `dialogError` for clean Escape.
- All 6 bottom sections (insights through recurring) moved inside
  `!loading` branch so empty zero-state doesn't flash pre-load.
- TrendsChart `data-month-index` + <480px alternate-hide CSS;
  per-bar aria-label preserves month info for SR at narrow widths.
- Global `prefers-reduced-motion` rule uses 0.01ms (keeps
  `transitionend` events firing — well-considered).
- `<p>` → `<div role="status">` HTML-validity fix; both call-sites
  have explicit `margin: 0` so layout unchanged.

**Nits (non-blocking, captured as TD candidates for follow-up):**
- `BudgetVsActual.aria-valuenow` could `Math.max(0, …)` defensively
  (ratio is non-negative by construction, so currently harmless).
- App.test.tsx Rent-test rescope uses `document.querySelector`
  rather than RTL's `within(list).findByText` — equivalent, less
  idiomatic.

**Forbidden-file audit:** `src/db/*`, `src/lib/*`, `src/hooks/*`,
backup schema v2, DB v5 — all UNTOUCHED.

**Source:** super-reviewer (Class A).

---

## iter-029 — super-reviewer (P6.D perf / bundle pass)

**Verdict:** APPROVE — confidence **high**.

Narrowly-scoped bundle-split delivery. Three rare-use management
surfaces (`CategoryManager`, `RecurringManager`, `BackupRestore`)
converted to `React.lazy` with per-component `<Suspense>` boundaries
sitting inside the existing `!loading` branch. No other changes —
explicit decision to skip `React.memo` / `useMemo` for aggregations
pending profiler evidence; no Vite config changes; lazy() boundaries
alone produce the chunk split.

**Bundle measurements (verified locally):**

| | Before | After | Δ |
|---|---|---|---|
| Main JS (raw) | 242.80 kB | 231.67 kB | **−11.13 kB** |
| Main JS (gzip) | 72.92 kB | 71.37 kB | **−1.55 kB** |
| Main CSS (raw) | 26.74 kB | 21.40 kB | **−5.34 kB** |
| Main CSS (gzip) | 4.38 kB | 3.84 kB | **−0.54 kB** |

Three lazy chunks (loaded only when user navigates to those
sections):
- RecurringManager: 6.43 kB raw / 2.25 kB gzip JS + 2.44/0.73 CSS
- BackupRestore: 4.80 kB / 1.67 kB JS + 1.81/0.62 CSS
- CategoryManager: 2.23 kB / 0.85 kB JS + 1.08/0.43 CSS

**Verified:**
- `lazy()` factory shape correct for named-export modules.
- Each Suspense wraps EXACTLY its corresponding lazy component
  (granular, non-blocking).
- All boundaries inside `!loading` — a11y-012 preserved.
- `parseBackup` + `db/restoreBackup` imported ONLY by
  BackupRestore — cleanly moved out of main chunk. No
  cross-chunk duplication.
- 588 tests pass without modification (RTL `findBy*` handles the
  lazy resolve transparently).

**Forbidden-file audit:** `src/db/*`, `src/lib/*`, `src/hooks/*`,
`vite.config.ts`, `package.json` UNTOUCHED. Only `src/App.tsx`
changed.

**Source:** super-reviewer (Class A).

---

## iter-030 — Phase-6 → Phase-7 arch pass

**Source:** arch-pass (mandatory phase-boundary;
`improve-codebase-architecture` skill invoked on entry).

The Explore agent walked the codebase organically: 5 stores +
factory + 19 lib modules + 5 domain hooks + 27 components +
App.tsx integration hub. Output: 7 deepening candidates +
existing-TD verdicts + 5 Phase 7 theme proposals.

### Existing-TD verdicts (one-line each)

- **TD.10** (`expenseVisibility` pipeline) — **DEFER**. Still no
  non-React consumer; useMemo granularity is a feature not smell.
- **TD.12** (refresh-after-mutation isolation) — **DEFER**.
  5 consumers, 12 iters stable, zero reports.
- **TD.13** (`downloadFile` adapter) — **PROMOTE TO PICK** 🟢.
  3 consumers MET (ExportButton, BackupExport, RecurringExport).
- **TD.14** (file-picker / file-restore-flow) — **PROMOTE TO
  PICK** 🟢; sharper to split as a thin `useFilePicker` hook
  plus an `parsedFileImporter` orchestrator. BackupRestore
  keeps its dialog logic in-place.
- **TD.15** (backupPipeline barrel) — **DEFER**. No schema-
  evolution pressure; v2 stable since iter-021.
- **TD.17** (App.handleDeleteCategory test gap) — **REAFFIRM**
  as small follow-up; low priority.
- **TD.18** (form-error-association sweep) — **PROMOTE TO PICK**
  🟢. Pair with TD.19 + TD.20.
- **TD.19** (skip-link), **TD.20** (persistent error region) —
  **REAFFIRM** as a11y polish; bundle with TD.18.

### NEW deepening candidates surfaced (TD.21..TD.24)

| # | TD | Candidate | Verdict |
|---|---|---|---|
| 1 | — | TD.13 reshape (`downloadFile` adapter) | 🟢 pick iter-031 |
| 2 | — | TD.14 split (`useFilePicker` + `parsedFileImporter`) | 🟢 pick iter-031 |
| 3 | TD.21 | CSV core concentration (`csv.ts` + `recurringCsv.ts` share 60-LOC tokenizer + helpers) | 🟡 promote when 3rd CSV consumer lands |
| 4 | TD.22 | App.tsx integration-hub split (`useAppFilters` + `useRecurringRollover` hooks) | 🟡 reassess at P7→P8 unless P7 adds another effect |
| 5 | TD.23 | Multi-hook error consolidation (replace string-cascade with `errors[]`) | 🟡 bundle with TD.20 |
| 6 | TD.24 | `bindStore<T, K>(mod, methodMap)` helper to remove the spy-friendly closure boilerplate from 5 domain hooks | 🟡 cleanup-bundle only |

### Recommendation

- **iter-031:** ship TD.13 + TD.14 together (sibling export/import
  seams, same testing pattern, both unblocked by the 3-consumer
  rule).
- **iter-032:** a11y-P1 bundle — TD.18 (form-error-association)
  + TD.19 (skip-link) + TD.20 (persistent error region) +
  TD.23 (multi-error consolidation).
- **TD.21 (CSV core)** promoted to pick once a 3rd CSV consumer
  lands (likely with the Phase 7 bank-CSV-preset theme).
- **TD.22 (App split)** parked; pick if Phase 7 adds another
  App-level effect.

### Phase 7 theme proposals

Constraint: local-only by CLAUDE.md charter. No network deps.

1. **Recurring-template EDIT** (currently add+remove only) —
   closes obvious UX gap; small surface; reuses ExpenseForm
   consolidation pattern (TD.3).
2. **Undo stack for mutations** — local-only, high UX leverage;
   `useStoredCollection` seam already invested.
3. **Bank-CSV import format presets** — concrete user value;
   locks in TD.21 (CSV core).
4. **Local-only categorization heuristics** (rule-based, e.g.
   "description contains STARBUCKS → Coffee") — pure-function
   lib; well within charter.
5. **Calendar-view tab** — pure-render on existing data;
   concentrates date-axis logic currently smeared across
   Trends + Month switchers.

Recommendation: pick 2-3 feature items + 1 polish bundle (iter-032
a11y-P1) for Phase 7 rather than full polish-phase. Feature
momentum is strong and the codebase is healthy.

---

## iter-031 — super-reviewer (fat-iter: TD.13 + TD.14)

**Verdict:** APPROVE-WITH-NITS — confidence **high**.

Two sibling export/import refactors shipped together via parallel
Class B sub-agents with disjoint allowlists. Both seams clean,
well-tested.

**TD.13 (downloadFile adapter):**
- `downloadFile({filename, mime, body}, env?)` lifts Blob+anchor+revoke
  dance from 3 export components. Optional injection bag for
  testability (document / url / scheduleRevoke).
- Safari/Firefox revoke-race fix landed at the seam:
  `URL.revokeObjectURL` scheduled via `setTimeout(fn, 0)` (default
  `scheduleRevoke`) — no longer synchronous after `a.click()`.
- `isoDateToday()` in `src/lib/month.ts` replaces 3 duplicated
  local-date helpers. UTC-based — user-observable near day
  boundaries; rationale documented in helper comment.
- 3 components collapse to one-liner `downloadFile({...})` calls.

**TD.14 (file-picker split):**
- `useFilePicker({onFile})` thin hook owns ref-reset +
  `file.text()`; reset happens BEFORE awaiting `onFile` so
  same-file re-pick fires onChange. All 3 components adopt.
- `useParsedFileImporter<TInput>({parse, importFn})` orchestrator
  owns headerError/summary/rowErrors. Header row-0 short-circuits
  without calling importFn. Composes parse + import errors with
  "Row N:" prefix. Only `ImportButton` + `RecurringImport`
  adopt this; `BackupRestore` keeps its dialog/atomic-restore
  logic in-place.
- ImportButton 94 → 62 LOC; RecurringImport 102 → 76 LOC.
  a11y attrs from iter-028 preserved.

**Bundle impact:** Main JS 231.67 → 232.11 kB (gzip 71.37 →
71.61; +0.24 kB gzip). Lazy chunks shrank: RecurringManager
6.43 → 5.84 kB, BackupRestore 4.80 → 4.64 kB. Consolidation
worked.

**Nits (non-blocking):**
- `useFilePicker.ts:38` `e.target.value` fallback is unreachable
  in current usage (ref always wired); harmless.
- `downloadFile.ts:54-58` SSR guard is untested.
- UTC filename change near day boundary — well-documented but
  worth a changelog note when this ships beyond the testbed.

**Forbidden-file audit:** `src/db/*`, `src/App.tsx`, backup
schema v2, DB v5 all UNTOUCHED.

**Source:** super-reviewer (Class A).

---

## iter-032 — super-reviewer (a11y-P1 bundle: TD.18 + TD.19 + TD.20 + TD.23)

**Verdict:** APPROVE-WITH-NITS — confidence **high**.

Four coherent fixes across form-error association, page navigation,
and App-level error fan-in. Single Class B sub-agent owned the
bundle since all surfaces shared App.tsx integration.

**TD.18 (form-error association, 5 forms):**
- New `FieldError` component — persistent slot, empty at rest,
  `role="alert"` toggles when message is non-empty. `aria-live="polite"`
  constant. `min-height: 1.25em` reserves layout.
- Each form discriminates `errorField` per validated input;
  `aria-invalid={errorField === '<name>'}` + `aria-describedby`
  point at the form's FieldError id.
- CategoryManager Rename: empty input now REVERTS to canonical name
  (was silent no-op) — clean, no extra alert region.

**TD.19 (skip-link):**
- `<a className="skip-link">Skip to expense list</a>` is FIRST child
  of `<main>`. `transform: translateY(-200%)` at rest;
  `:focus` reveals. Themed via `--app-accent` / `--app-accent-fg`.
- Target: new `<section id="main-content" aria-label="Expense list">`
  wrapping ExpenseList.

**TD.20 + TD.23 (App error fan-in):**
- `error = a || b || c || …` cascade replaced with
  `errors: string[]` (filter falsy + join " · ").
- Persistent slot: `<div role="alert" aria-live="assertive"
  aria-atomic="true">` ALWAYS in the DOM, empty at rest.
- Multi-error case test exercises two hooks failing simultaneously.

**Nits (non-blocking):**
- The "no iter-028 test updates needed" claim relies on
  ExpenseForm's amount validation being permissive (only catches
  `isNaN || empty`, NOT negative/zero — those fall through to the
  hook layer and surface via the App alert, not the form's
  FieldError). If form-level positivity validation is ever added,
  iter-028 `findByRole('alert')` queries in `App.test.tsx:114,
  153,160` could double-up. Worth a TD/comment.
- `.field-error--shown` CSS class has empty body — harmless hook,
  could be removed.

**Forbidden-file audit:** `src/db/*`, `src/lib/*`, `src/hooks/*`,
backup schema v2, DB v5 all UNTOUCHED.

**Source:** super-reviewer (Class A).

## iter-034 — super-reviewer (P7.A recurring EDIT + P7.B undo stack)

**Verdict:** REQUEST_CHANGES → resolved same-iter → APPROVE-equivalent
post-fix. Confidence **high** (super-reviewer original verdict);
critical resolved + 1 regression test added.

Two disjoint sub-agents (P7.A on `lib/recurring` + `hooks/useRecurringTemplates`
+ `RecurringManager`; P7.B on new `useUndoStack` + `UndoToast` + `App.tsx`
integration) shipped 39 new tests. Super-reviewer found 1 real bug + 1
test gap + a cluster of warnings/nits.

**Critical (FIXED in iter-034):**
- App.tsx category-budget undo inverse used `${month}:${categoryId}`
  (colon) instead of the canonical `categoryBudgetId(month, categoryId)`
  helper (pipe `|`). Silently no-op'd when prior amount was undefined.
  Fixed: import + call the helper. New regression test asserts a
  from-scratch set + Undo removes the row.

**Warnings (documented as known limitations, not fixed this iter):**
- Recurring-template delete-undo can race against the rollover effect
  (App.tsx:171-190): deleting a rolled-over expense re-flags the template
  as due → effect fires `addMany` → user clicks Undo within 6s → both
  rows present. Niche window; iter-034 ships with this gap. Future
  inverse should check for existing sourceTemplateId match before
  re-adding.
- Recurring-template DELETE+undo re-adds with a fresh UUID → orphans the
  expenses generated by the old template id. Documented in App.tsx
  comments. Acceptable for v1; ideal fix is a per-hook `restore(entity)`
  preserving id (defer to TD).
- Budget set + same-value undo is pushed unconditionally (no
  `before === after` guard like category rename has). Minor UX phantom.
- Inverse-failure silently warns to console + clears pending — user gets
  no error feedback if the re-add itself fails. Future iter could route
  through `app__error` (assertive region).

**Nits (carry-forward to TD list):**
- `noopAddMany` + the defensive `onUpdate` fallback branch in
  RecurringManager are unreachable in the integrated app — kept for
  unit-test isolation. Could simplify when the wiring is stable.
- `useUndoStack` uses a `pendingRef` workaround (dual source of truth
  with `pending` state) to keep callbacks stable. Correct, but could
  collapse to `useCallback([pending])` for clarity.
- Smart-quotes in undo labels (`Deleted “Lunch”`) couple test queries to
  the unicode chars; consider a label constant.
- UndoToast text appears in `document.body.textContent`, polluting
  unscoped `screen.getByText` queries — already required scoping in
  App.test.tsx (post-edit "Coffee" assertion). A portal would isolate it.

**Cross-feature concern resolved:** `app__error` (`role="alert"`,
assertive) and `undo-toast` (`role="status"`, polite) coexist correctly.

**Source:** super-reviewer (Class A).
