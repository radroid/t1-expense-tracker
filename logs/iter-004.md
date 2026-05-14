# iter-004

**Phase:** Phase 2 — Categories (kickoff) · **Mode:** fat-iter (2 features) · **pr_mode:** true

## Features landed
- **P2.A** — Category model + store + shared DB module (`src/db/db.ts` shared opener,
  `expenseStore` refactored onto it, `category` model, `categoryStore` + seed) — PR #11
- **P2.B** — Category management UI (`CategoryManager`, App wiring + category handlers) — PR #12

Both merged to `main`. Final gate: 104 tests pass, tsc + lint + build clean.

## How it went
- 2 features, not 3+: P2.A is the Phase 2 dependency root; P2.C–F all need it. Shipped
  P2.A + P2.B (foundation), parallel Class B sub-agents with disjoint allowlists.
- **Notable**: P2.A had to absorb a refactor — `expenseStore` opened DB at v1; adding a
  `categories` store needs a shared `openDb` at v2. Extracted `src/db/db.ts` (shared
  `openDb` + generic `withStore(storeName,...)`); peer review confirmed the expenseStore
  refactor is behaviour-preserving (regression test untouched).
- Class A peer review: APPROVE both. Flagged `CategoryRow`'s stale rename-buffer.
- CodeRabbit: PR#11 8 findings — applied 2 real test gaps (uppercase hex, error-message
  assertions), declined 4 plan-doc nitpicks + the "withStore can't do seed" major
  (verified non-issue — impl loops per-`addCategory`) + a marginal micro-opt. PR#12 3
  findings — applied all: silent rename-failure → setError; Save button stale name →
  visible "Save" + aria-label; CategoryRow stale buffer → `key={id:name}` remount
  (NOT the suggested setState-in-effect — ESLint `react-hooks/set-state-in-effect`
  forbids it; the key trick is the idiomatic fix).

## Decisions
- App's initial load is now one `Promise.all([getAllExpenses, seedDefaultCategories])`
  behind a single `loading` flag — avoids the multi-async-effect connection-leak trap
  (tests gate on one settled signal, not N).

## Wake-up handoff
- **Current phase:** Phase 2 — Categories. Done: P2.A, P2.B. Remaining: P2.C (assign
  category to expense), P2.D (filter by category), P2.E (category badges), P2.F
  (spending by category).
- **Next step:** iter-005 — pick from P2.C–F. Independence check: **P2.C** touches both
  forms (AddExpenseForm + EditExpenseForm — category picker); **P2.D** touches App +
  ExpenseList (filter); **P2.E** touches ExpenseList (badge); **P2.F** is new files
  (`categoryTotals` lib + `SpendingByCategory` component). P2.D + P2.E both touch
  ExpenseList → can't parallelise. Likely: **P2.C + P2.F** (disjoint) + maybe P2.D or
  P2.E solo. TD.3 (`ExpenseForm` dedup) is worth doing BEFORE P2.C — P2.C adds a picker
  to both forms; dedupe first = add the picker once. Consider a refactor-first iter.
- **Files to open first:** `GOALS.md`, `src/components/AddExpenseForm.tsx` +
  `EditExpenseForm.tsx` (for P2.C / TD.3), `src/components/ExpenseList.tsx`,
  `src/lib/category.ts`, `src/lib/totals.ts` (pattern for `categoryTotals`).
- **Open questions:** do TD.3 (`ExpenseForm` dedup) before P2.C? Strong yes — see above.
- **Carry-forward:** TD.1–TD.5 in `GOALS.md`. TD.3 is now timely (P2.C will touch both
  forms). `CategoryRow` stale-buffer is FIXED (key remount).
- **Scheduled:** 1800s — token runway tight after 4 full in-session iters; STRONGLY
  recommend the user start a fresh Claude Code session before iter-005.
