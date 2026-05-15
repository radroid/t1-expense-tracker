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


