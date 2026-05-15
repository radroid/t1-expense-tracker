# iter-017

**Phase:** Phase 4 → Phase 5 boundary · **Mode:** arch pass (no code
changes) · **pr_mode:** true

## Arch pass output

Mandatory phase-boundary arch pass per loop protocol. `Skill` tool
invoked with `skill: "improve-codebase-architecture"`. Class A Explore
agent walked the codebase organically. Five deepening opportunities
surfaced, ranked by leverage : risk ratio:

| # | Candidate | Decision |
|---|---|---|
| 1 | Generic `useStoredCollection<T, TInput>` hook | **PICKED for iter-018** (TD.7) |
| 2 | `src/lib/errorMessages.ts` constants map | Bundle into iter-018 if scope allows (TD.8) |
| 3 | Generic `makeStore<T>` factory | Post-iter-018 (TD.9) |
| 4 | Pure `src/lib/expenseVisibility.ts` pipeline | Deferred — no non-React consumer (TD.10) |
| 5 | Drop vestigial `Expense.recurring?: boolean` | Deferred — DB cleanup iter (TD.11) |

Full rationale, deletion-test analysis, and risk notes logged in
`logs/blocks.md` under `## iter-017 — Phase-4 → Phase-5 arch pass`.

## How it went

- Single Explore agent dispatch (Class A, read-only). Walked all four
  hooks, all four store files, `useVisibleExpenses`, `App.tsx` wiring,
  and `lib/expense.ts`. Returned 5 candidates + a recommendation.
- No sub-agent dispatched for impl this iter — that's iter-018's work.
- No CodeRabbit / super-reviewer pass needed: this iter ships only
  documentation (`logs/`, `GOALS.md` TD additions, `.loop/state.json`
  bump).

## Decisions / notes

- **`useStoredCollection<T>` confirmed deep, not shallow.** Deletion
  test: removing the generic forces all four hooks to re-expand the
  state-machine + load + mutate-and-refresh pattern. Complexity
  concentrates in one place rather than smeared across N callers.
- **Sequencing #1 → #3 (not parallel).** The hook generic exposes the
  store seam; ship hooks first, observe what `makeStore<T>` actually
  needs to expose. Doing both in parallel risks over-designing the
  store factory to fit the hook before the hook stabilizes.
- **#4 deferred, not declined.** The pipeline IS already mostly pure
  (filter primitives in `lib/expenseFilter.ts`); only the orchestration
  lives in the hook. Lifting it adds testability for a non-React
  consumer (e.g., recurring rollover if it ever runs outside React,
  CSV-export-without-UI), but no such consumer exists. Honest deferral.
- **#5 deferred:** kept the vestigial `recurring?: boolean` in
  `Expense` to avoid risking persisted-record cleanup mid-Phase-5. The
  field is unused in code; first edit on a historical record drops it
  via `applyExpenseEdit`. Pair with a future DB-cleanup iter that also
  considers DB v4 → v5.

## Wake-up handoff

- **Current phase:** Phase 5 (starting). Arch pass done. No GOALS.md
  Phase 5 items have been defined yet — Phase 5 themes are listed in
  the Phase 5 stub. Triage at the start of iter-019 (after iter-018
  ships the arch-pass-driven refactor).
- **Next step:** iter-018 — single-feature impl iter shipping **TD.7
  (`useStoredCollection<T>`)** and, if scope allows, **TD.8
  (`errorMessages.ts`)**. Both refactors must preserve every existing
  test green (the four hooks already have ~50 tests across them — that
  IS the contract the generic must satisfy).
- **Files to open first:** `src/hooks/useExpenses.ts` (largest hook;
  best reference for the contract shape), `src/hooks/useCategories.ts`
  (has the most domain-specific methods — `rename` + seed), the four
  hook test files (to confirm the contract surface), `src/lib/errorMessages.ts`
  (new, if TD.8 bundles).
- **Open questions:** (1) Generic shape — does
  `useStoredCollection<T, TInput>` accept a `validator: (input) => T`
  + a `store: { add, getAll, update?, remove }` config, or a richer
  options bag? (2) Should the generic expose `add`/`update`/`remove`
  with their store-method names, or domain-renameable? Lean: domain
  hooks wrap and rename (e.g. `useCategories.rename` wraps
  `genericUpdate`). (3) Does the generic own `Promise<boolean>` return
  shape, or expose raw outcomes for domain hooks to massage? Lean:
  generic owns the boolean contract; it's universal across all four
  consumers.
- **Carry-forward:** TD.6 (category-deletion cascade — product
  decision still pending); TD.7-TD.11 logged this iter; deferred
  `useSpendingByCategory` typing pair-up; P3.D chart `<text>`
  aria-hidden follow-up; centralise localStorage test shim in
  `src/test/setup.ts` when 2nd consumer lands; DateRangeFilter `from>to`
  normalize (low priority); CSV-injection prefix-escape on export (low
  priority); empty-state trailing-period normalize; P4.G follow-up
  loading-covers-insights; CSV export/import of recurring templates.
- **Scheduled:** 600s (impl iter — TD.7 is a concrete refactor with
  test-survival as the gate).
