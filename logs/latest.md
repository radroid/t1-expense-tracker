# Latest

Latest: iter-017 — mandatory phase-boundary arch pass. `Skill` tool
invoked with `improve-codebase-architecture`. 5 deepening candidates
surfaced; iter-018 picks up TD.7 (`useStoredCollection<T>`).

Stage: S3 (Phase 5 starting) — see `.loop/state.json` (`pr_mode: true`,
  `pr_size_policy: fat`)
Next step: iter-018 — single-feature impl iter for **TD.7
  (`useStoredCollection<T, TInput>` generic hook)**, bundling **TD.8
  (errorMessages.ts constants map)** if scope allows. Refactor the four
  existing hooks (`useExpenses`, `useCategories`, `useMonthlyBudgets`,
  `useRecurringTemplates`) to thin domain wrappers around the generic.
  All ~50 existing hook tests + 373 total tests must stay green — that
  IS the contract the generic must satisfy.
Open first: `src/hooks/useExpenses.ts` (largest hook; best reference
  for the contract), `src/hooks/useCategories.ts` (has domain-specific
  methods — `rename` + seed), the four hook test files (contract
  surface), the planned `src/lib/errorMessages.ts` (new — bundle in if
  TD.8 fits).
Open blocks: none open — see `logs/blocks.md` for iter-017 arch-pass
  output (5 candidates with deletion-test analysis + sequencing
  recommendations).
Carry-forward: TD.6 (category-deletion cascade — product decision
  pending); TD.7 (picked for iter-018); TD.8 (bundle target); TD.9
  (makeStore<T> factory — post-iter-018); TD.10 (expenseVisibility.ts
  pipeline — deferred); TD.11 (drop vestigial Expense.recurring —
  deferred to DB cleanup); deferred `useSpendingByCategory` typing
  pair-up; P3.D chart text aria-hidden follow-up; centralise
  localStorage test shim in src/test/setup.ts when a 2nd consumer
  lands; DateRangeFilter from>to normalize (low priority);
  CSV-injection prefix-escape on export (low priority); empty-state
  trailing-period normalize; P4.G follow-up: spinner covers insights
  section; CSV export/import of recurring templates.
Test gate: 373 tests pass (this iter ships no code changes).
Push: n/a — pr_mode, all work merged via PRs.

Last-iter shipped:
- arch-pass output (no code) — `logs/blocks.md` ## iter-017 — Phase-4
  → Phase-5 arch pass section; `GOALS.md` adds TD.7-TD.11 with
  iter-targets / deferral rationale; `logs/iter-017.md`;
  `.loop/state.json` bumped to 17.

Operational notes for iter-018:
  - **Contract preservation is the gate.** The four existing hook test
    suites are the test surface. The generic must produce hooks that
    pass all those tests unchanged (or with only label-equivalent
    changes if test text references hook-specific error strings).
  - **Cadence:** 600s (impl iter — refactor with a concrete shape).
  - **Process-fix held**: explicit-path staging on every commit.
    Six-iter streak. Keep it up.
  - `vite.config.ts` `fileParallelism: false` still load-bearing — keep.
  - Node 25 localStorage shim hack still per-test-file. The hook
    generic might be a natural moment to revisit shim placement.
  - **DB version is 4**. Vestigial `Expense.recurring?: boolean`
    intentionally retained (TD.11).

Open questions for iter-018 (note in plan):
  (1) Generic surface: validator + store config, or richer options bag?
      Lean: minimal — `(validator, store)` + optional onLoad/onChange
      callbacks if any hook needs them.
  (2) Method names on the generic: store-named (`add`, `getAll`,
      `update`, `remove`) or domain-renameable in the wrapper? Lean:
      generic exposes generic names; domain hooks rename (e.g.
      `useCategories.rename` wraps `useStoredCollection.update`).
  (3) `Promise<boolean>` return shape: generic-owned or wrapper-owned?
      Lean: generic-owned — universal across all four consumers.
  (4) Error string ownership: does the generic set the error string
      (which means TD.8 errorMessages map is a precondition), or does
      the wrapper handle error messaging? Lean: bundle TD.7 + TD.8 in
      one PR; the wrapper passes its messages map to the generic
      during binding.
