# iter-002

**Phase:** Phase 1 — Core expense CRUD + persistence · **Mode:** fat-iter (2 features) · **pr_mode:** true

## Features landed
- **P1.E** — Delete expense (`ExpenseList` optional `onDelete` + per-row button; App
  `handleDelete` → `removeExpense` → refresh, with try/catch) — PR #6
- **P1.G** — Running total (`totalAmount` reducer + `RunningTotal` component; App header) — PR #7

Both merged to `main`. Final gate: 53 tests pass, tsc + lint + build clean.

## How it went
- Only 2 features this iter, not 3+: P1.E and P1.F both modify `ExpenseList.tsx`, so they
  can't run as parallel sub-agents. Shipped E+G (genuinely disjoint), deferred P1.F.
- Built via 2 parallel Class B sub-agents (disjoint allowlists), TDD throughout.
- Class A integrated peer review: APPROVE both. Follow-up: duplicated `currencyFormatter`
  → logged as GOALS.md tech-debt item TD.1.
- CodeRabbit: PR#6 4 findings — applied the 1 major (handleDelete error handling + test),
  declined 3 plan-doc nitpicks (retroactive edits to a historical scoping doc). PR#7 clean.

## Decisions
- App.tsx wiring (handleDelete, RunningTotal in a new `<header>`) done by the main agent
  as integration glue, shipped inside PRs #6 and #7 — same pattern as iter-001.
- Semicolon convention: instructed sub-agents semicolon-free (Vite scaffold style); did
  not retro-fix existing files. Repo is still mixed — a Prettier config would settle it
  (candidate future GOALS item, not urgent).

## Blocks / notes
- `gh pr merge 6` hit a transient "Base branch was modified" GraphQL error right after a
  push; retried after re-checking mergeable state — merged clean. No real conflict.

## Wake-up handoff
- **Current phase:** Phase 1 (6 of 7 done: P1.A–E, P1.G). Only **P1.F (edit expense)** remains.
- **Next step:** iter-003 — ship **P1.F** solo (it owns `ExpenseList.tsx` row surface +
  likely a new `EditExpenseForm` + App edit state; no other Phase 1 item left to bundle).
  This is the Phase 1 carry-forward tail — single feature, not a fat-iter. After P1.F,
  Phase 1 is done → **phase boundary: invoke `improve-codebase-architecture` skill**
  before starting Phase 2 (Categories).
- **Files to open first:** `GOALS.md`, `src/components/ExpenseList.tsx`,
  `src/components/AddExpenseForm.tsx` (edit form may mirror it), `src/App.tsx`,
  `src/db/expenseStore.ts` (`updateExpense` already exists).
- **Open questions:** P1.F edit UX — inline row edit vs. modal/separate form. Lean
  toward a reused/adapted form component over inline editing.
- **Carry-forward:** (1) TD.1 — dedupe `currencyFormatter` into `src/lib/` (good to fold
  into the Phase-1→2 arch pass). (2) phase-boundary arch pass is due after P1.F.
- **Scheduled:** 600s — Phase 1 impl tail, healthy token runway.
