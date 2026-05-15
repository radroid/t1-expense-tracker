# iter-018

**Phase:** Phase 5 — first arch-pass-driven refactor · **Mode:**
single-feature · **pr_mode:** true

## Refactor landed

- **TD.7 + TD.8 (PR #48)** — `useStoredCollection<T, TInput, K>` generic
  + `errorMessages.ts` constants map. Iter-017 arch pass candidates #1
  + #2 shipped together. The four domain hooks (`useExpenses`,
  `useCategories`, `useMonthlyBudgets`, `useRecurringTemplates`)
  collapsed into thin wrappers that bind a `Store<T, K>` + validators +
  per-domain message bundle. Each wrapper shrank from ~70-150 LOC to
  ~50-90 LOC, exposing domain-shaped surface (`addMany`, `rename`,
  `set`, `getFor`) on top of the generic.

Final gate: **388 tests pass** (373 → 388, +15 for the generic + 5 for
errorMessages constants), tsc + lint + build clean. **Zero pre-existing
test files were edited** — test-preservation was the gate, and it held.

## How it went

- Single Class B sub-agent. Allowlist covered the four hook files +
  four new files (generic + tests + errorMessages + tests). Process-fix
  held — explicit-path staging. Seven-iter streak.
- CodeRabbit: 6 findings. 1 applied (strengthen assertion in
  no-validateUpdate test case), 4 logged as TD.12 (refresh-after-mutation
  error isolation — preserves pre-refactor behavior; flipping the
  boolean contract is out of refactor scope), 1 declined (`refresh`
  escape hatch — callers wrap), 1 TDD-ordering nit declined.
- Super-reviewer APPROVE (high confidence). Verified: behavior parity
  on 3 representative paths, errorMessages strings match the OLD hook
  text verbatim, vi.spyOn-compatible closure wrapping, `Object.isFrozen`
  asserted, no `.test.ts` files edited, field aliases (`expenses`,
  `categories`, etc.) preserved for App.tsx + every existing test.

## Decisions / notes

- **Test preservation is the contract.** No pre-existing test file
  edits — only added 20 new tests (15 generic + 5 frozen-bundle). This
  is the gate that proved behavior parity across the refactor.
- **Closure-wrapped store methods** — each wrapper does
  `add: (e) => addExpense(e)` rather than `add: addExpense`. The arrow
  re-resolves the namespace binding at call time, so
  `vi.spyOn(store, 'addExpense').mockRejectedValueOnce(...)` keeps
  working. Documented in each wrapper.
- **`bootstrap` runs inside the load effect** — categories seed defaults
  before the initial getAll. Loading flag stays true through seed +
  load. Super-reviewer noted one redundant `getAllCategories` call
  on first mount (seed-then-getAll vs old seed-and-return); behavior
  identical, perf nit only. Not worth its own TD.
- **TD.12 added: refresh-after-mutation error isolation.** CR's 4 MAJOR
  findings flagged the same latent issue: if `store.add/update/remove`
  succeeds but the post-mutation `store.getAll()` throws, `setError`
  fires the "Failed to..." message and returns `false` despite the
  mutation persisting. This was the pattern in EVERY pre-iter-018 hook
  — refactor preserved it verbatim. Flipping changes the
  `Promise<boolean>` contract; coordinate test updates first.
- **Optional `update` branch is defense-in-depth.** Budgets + templates
  wrappers don't expose `update` on their public types, but the
  generic's `update()` still has a no-validateUpdate fallback (sets
  `messages.update ?? messages.add`, returns false). Tested.

## Wake-up handoff

- **Current phase:** Phase 5 (1 refactor landed — TD.7 + TD.8).
- **Next step:** iter-019 — choose between (a) the next arch-pass
  candidate **TD.9 (`makeStore<T>` factory)** as a continuation
  refactor, or (b) start defining Phase 5 features. Lean: **(b)**.
  The arch-pass output flagged TD.9 as "sequence after TD.7 ships and
  the hook generic is stable" — one iter of stability is reasonable
  but not strictly required. More importantly, Phase 5 has no defined
  features yet — the backlog stub lists candidate themes but no
  scoped items. iter-019 should triage the Phase 5 themes (per-category
  budgets, multi-currency, JSON backup, URL filter persistence) and
  pick the first concrete feature. Park TD.9 for iter-020 or later.
- **Files to open first:** `GOALS.md` (Phase 5 stub at the bottom of
  Phase 4 section), `logs/blocks.md` ## iter-017 arch pass section
  (theme list).
- **Open questions:** (1) Per-category budgets — extends `MonthlyBudget`
  with a category dimension OR a new `categoryBudgets` store keyed on
  (month, categoryId)? Lean: new store (preserves single-purpose
  MonthlyBudget). (2) Multi-currency — single-currency-per-expense
  field or per-user setting? Lean: per-expense (more flexible). (3)
  JSON backup/restore — distinct from CSV (full state including
  templates, categories, budgets). Reasonable iter-019 candidate if
  per-category budgets is too large.
- **Carry-forward:** TD.6 (category-deletion cascade — product
  decision still pending); TD.9 (makeStore factory — sequenced after
  TD.7 is stable); TD.10 (expenseVisibility.ts pipeline — deferred);
  TD.11 (drop vestigial Expense.recurring — deferred); TD.12
  (useStoredCollection refresh-after-mutation error isolation —
  logged this iter); deferred `useSpendingByCategory` typing pair-up;
  P3.D chart `<text>` aria-hidden follow-up; centralise localStorage
  test shim; DateRangeFilter `from>to` normalize; CSV-injection
  prefix-escape; empty-state trailing-period normalize; P4.G follow-up
  loading-covers-insights; CSV export/import of recurring templates.
- **Scheduled:** 1500s (plan-iter — Phase 5 feature triage benefits
  from longer cadence; impl pace returns once first feature is scoped).
