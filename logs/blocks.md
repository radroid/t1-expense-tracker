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


