# Latest

Latest: iter-022 — P5.E (multi-currency) shipped (PR #56). **Phase 5
CLOSED**: all 5 items done (P5.A URL filters, P5.B JSON backup
export, P5.C JSON backup restore, P5.D per-category budgets, P5.E
multi-currency).

Stage: S3 (Phase 5 → Phase 6 boundary) — see `.loop/state.json`
  (`pr_mode: true`, `pr_size_policy: fat`)
Next step: iter-023 — **MANDATORY PHASE-BOUNDARY ARCH PASS**. Hard
  rule from the loop protocol: before any Phase 6 feature work,
  invoke the `improve-codebase-architecture` skill (an actual tool
  call, not a concept), surface deepening opportunities, and log
  results to `logs/blocks.md` with `**Source:** arch-pass`. The arch
  pass output drives any pre-Phase-6 refactor and shapes the Phase 6
  backlog in `GOALS.md` (currently empty — Phase 5 was the last
  defined phase).
Open first (for arch-pass context): `GOALS.md` (Phase 6 stub TBD;
  arch-pass produces it); `logs/iter-017.md` (the previous phase-
  boundary arch pass — useful reference for the candidate-list
  pattern); `logs/blocks.md` ## iter-017 section.
Open blocks: none open — see `logs/blocks.md` for iter-022 super-
  reviewer notes (APPROVE high confidence; forbidden-file audit
  clean; localStorage shim centralisation verified).
Carry-forward candidates the iter-023 arch pass should consider
  (already on TD radar):
  - TD.9 (`makeStore<T>` factory) — sequencing constraint cleared
    3 iters ago; STRONG arch-pass-driven pickup candidate.
  - TD.10 (`expenseVisibility.ts` pipeline) — still no non-React
    consumer; recheck.
  - TD.11 (drop vestigial `Expense.recurring`) — DB-cleanup; bundle
    with TD.9?
  - TD.12 (useStoredCollection refresh-after-mutation error
    isolation) — preserves pre-iter-018 behavior; seam is now stable.
  - formatUSD shim removal — no shipping caller remains; one-PR
    drop.
  - Centralise localStorage test shim — DONE in iter-022 (after
    useCurrency became 2nd consumer).
Test gate: 527 tests pass; `npm run build` + `npm run lint` clean.
Push: n/a — pr_mode, all work merged via PRs.

Last-iter shipped:
- P5.E (#56): `src/lib/currency.ts` expanded (CurrencyCode +
  formatCurrency + storage seam + @deprecated formatUSD shim);
  `src/hooks/useCurrency.{ts,test.ts}` (lazy-init + setCurrency);
  `src/components/CurrencySelector.{tsx,test.tsx,css}` (labeled
  select, 44px touch target); 6 money-rendering components grew a
  `currency` prop; `src/App.tsx` wired useCurrency + selector;
  `src/test/setup.ts` centralised the localStorage shim + added
  global afterEach cleanup. +31 tests (496 → 527).

Operational notes for iter-023:
  - **PHASE BOUNDARY** — Hard rule. Invoke `Skill` tool with
    `skill: "improve-codebase-architecture"` as the FIRST action.
    Real tool call, NOT just reading the doc and improvising.
  - **Cadence:** 1500s (plan-iter — arch pass is thinking work).
  - **Process-fix held**: explicit-path staging on every commit.
    Eleven-iter streak. Keep it up.
  - `vite.config.ts` `fileParallelism: false` still load-bearing.
  - **localStorage shim centralised** as of iter-022. New test files
    don't need per-file beforeAll boilerplate; `src/test/setup.ts`
    handles install + global afterEach cleanup.
  - **DB version is 5**, backup `BACKUP_SCHEMA_VERSION` is 2,
    `useStoredCollection` is the hook seam, `errorMessages.ts` is
    the messaging seam, `currency.ts` is the formatter seam — these
    are stable surfaces for the arch pass to evaluate.

Open questions for iter-023 (arch pass):
  (1) Is `makeStore<T>` factory (TD.9) ready to ship now that
      `useStoredCollection` has 4 stable consumers + 11 iters since?
      Apply the deletion test.
  (2) Should `formatUSD` shim be deleted in iter-024 as a small
      cleanup, or wait for a broader currency.ts refactor?
  (3) Has any new shallow seam emerged from Phase 5 (the 4 backup-
      pipeline files all touch the same snapshot shape — is there a
      `backupPipeline` deeper module hiding there)?
  (4) Phase 6 themes — needs product input + architectural
      perspective on what's worth shipping next (per-expense
      currency w/ FX? analytics? a11y audit? perf pass?).
