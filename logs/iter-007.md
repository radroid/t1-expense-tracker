# iter-007

**Phase:** Phase 2 — Categories · **Mode:** fat-iter (2 features) · **pr_mode:** true

## Features landed
- **P2.E** — Category badges (`ExpenseList` per-row colored badge; required `categories` prop) — PR #18
- **P2.F** — Spending by category (`spendingByCategory` reducer + `SpendingByCategory` component; App renders a new "Spending by category" section) — PR #19

Both merged to `main`. Final gate: 130 tests pass, tsc + lint + build clean.

## How it went
- 2 parallel Class B sub-agents, disjoint allowlists (P2.E owned `ExpenseList.*`, P2.F
  created new lib + component). Main agent wired `App.tsx` per branch (categories prop
  for P2.E, render `<SpendingByCategory>` for P2.F).
- Class A peer review: APPROVE both. Verified orphan handling is consistent across
  features — a `categoryId` pointing at a deleted category renders no badge in P2.E
  but is still bucketed under "Uncategorized" in P2.F. UX is coherent: no money leaks
  from the summary even when the list goes silent.
- CodeRabbit: 2 nits on PR #18 (memoize the lookup Map, querySelector type) — both
  declined as premature/cosmetic; 1 nit on PR #19 (avoid non-null assertions via
  branching) — declined as cosmetic. All true-positive findings would have been logged.

## Decisions / notes
- Currency formatter is now triplicated (`RunningTotal`, `ExpenseList`, `SpendingByCategory`).
  TD.1 already tracks this; `SpendingByCategory.tsx` carries an in-code TD.1 comment.
- App-test scoping: `getByText('$25.50')` for the running-total assertion now scopes via
  `selector: '.running-total__amount'` — the dollar string also legitimately appears in
  the new component. Same disambiguation pattern as iter-006's category-name rescoping.

## Wake-up handoff
- **Current phase:** Phase 2 — Categories. Done: P2.A, P2.B, P2.C, P2.E, P2.F, TD.3.
  Remaining: **P2.D (filter by category)** — the last Phase 2 feature.
- **Next step:** iter-008 — ship **P2.D solo**. Adds a category filter control above the
  expense list (filter by selected category id, also "All" + "Uncategorized" options);
  filtering happens in App (App owns the visible-expense state) and ExpenseList just
  renders what it's given. Once P2.D merges, Phase 2 is done → **phase boundary: invoke
  the `improve-codebase-architecture` skill before starting Phase 3** (Budgets & insights).
- **Files to open first:** `GOALS.md`, `src/App.tsx`, `src/components/ExpenseList.tsx`,
  `src/lib/category.ts`.
- **Open questions:** P2.D scope — should the filter also scope the `RunningTotal` and
  `SpendingByCategory`? Leaning yes (the header should reflect what the user sees), but
  open. Note in the iter-008 plan.
- **Carry-forward:** TD.1 (formatCurrency, getting more pressing as it spreads),
  TD.4 (useExpenses/useCategories hooks), TD.5 (DB-migration test), TD.6 (category-
  deletion cascade). After P2.D + arch pass, a refactor iter for TD.1 + TD.4 is timely.
- **Scheduled:** 600s (Phase 2+ impl default — no token rationing).
