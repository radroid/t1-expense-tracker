# Latest

Latest: iter-023 — **Phase 5 → Phase 6 mandatory arch pass**. Six
candidates surfaced; three picked for iter-024 (cleanup-week:
TD.9 `makeStore<T,K>` factory + TD.11 drop `Expense.recurring` +
TD.16 delete `formatUSD` shim). No production code shipped this
iter. Phase 5 stays CLOSED; Phase 6 stub added to GOALS.md
(themes triaged at iter-025).

Stage: S3 (Phase 5 closed; cleanup-week pending) — see
  `.loop/state.json` (`pr_mode: true`, `pr_size_policy: fat`)
Next step: iter-024 — **cleanup-week**. Ship TD.9 + TD.11 + TD.16
  in a single coherent refactor PR (bundle TD.15 backupPipeline
  barrel IF diff stays under ~600 LOC net; otherwise defer).
Open first (for iter-024): `src/db/db.ts`; `src/db/expenseStore.ts`,
  `src/db/categoryStore.ts` (the factory's first 3 callers);
  `src/lib/expense.ts` (TD.11); `src/lib/currency.ts` +
  `currency.test.ts` (TD.16); `logs/blocks.md` ## iter-023 section
  for the candidate rationale + decisions; `logs/iter-023.md`
  wake-up handoff.
Open blocks: none open. Arch pass logged under `## iter-023 —
  Phase-5 → Phase-6 arch pass` with `**Source:** arch-pass`.

Test gate: 527 tests pass (unchanged — thinking iter, no code).
Push: PR #58 (iter-023 closeout) — see `gh pr view 58` after
  merge.

Last-iter shipped: nothing (thinking-iter). Deliverables were:
  - `logs/blocks.md` ## iter-023 section (6 candidates +
    deletion-test analysis + decision summary table + iter-017
    deferral re-evaluation).
  - `GOALS.md`: TD.9 + TD.11 amended with iter-023-arch-pass
    pickup markers; TD.13, TD.14, TD.15, TD.16 added; Phase 6
    stub section appended.
  - `logs/iter-023.md` (wake-up handoff for iter-024).
  - `.loop/state.json` bumped to iter 23.

Operational notes for iter-024:
  - **Cadence:** 600s (impl-iter — concrete refactor work).
  - **Process-fix held**: explicit-path staging on every commit.
    Twelve-iter streak. Keep it up.
  - `vite.config.ts` `fileParallelism: false` still load-bearing.
  - **localStorage shim centralised** in `src/test/setup.ts`.
  - **DB version is 5**, backup `BACKUP_SCHEMA_VERSION` is 2,
    `useStoredCollection` is the hook seam, `errorMessages.ts`
    is the messaging seam, `currency.ts` is the formatter seam
    — all stable as of the arch pass.
  - **iter-024 is solo-agent** OR **two parallel sub-agents** at
    most. TD.9 is the primary; TD.11 + TD.16 are pure
    subtractions and small. Allowlists must stay disjoint if
    parallel: TD.9 owns `src/db/*`; TD.11+TD.16 owns
    `src/lib/expense.ts` + `src/lib/csv.ts` + `src/lib/currency.ts`
    + their tests + the two stale test-description files.

Open questions for iter-024:
  (1) `makeStore<T, K>`: does `categoryBudgetStore` (composite-key
      `${month}|${categoryId}`) require an override hook on the
      factory, or does the factory accept the natural store key
      type as the K type-param and the domain module passes the
      composite-id-builder result as the key? Lean: type-param
      only; domain modules build the id; factory stays IDB-thin.
  (2) Should the `formatUSD`-pinned test in `currency.test.ts`
      be deleted along with the shim, or retained as a "shim
      removed" tombstone test? Lean: delete cleanly — the test's
      reason to exist disappears with the shim.
  (3) TD.15 bundle decision: gate on diff size after TD.9 +
      TD.11 + TD.16 land. If under ~600 LOC net, bundle the
      barrel. If over, defer to a backup-schema-evolution iter.
