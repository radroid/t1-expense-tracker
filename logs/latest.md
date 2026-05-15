# Latest

Latest: iter-033 — **Phase 7 planning iter (bookkeeping).**
Phase 7 titled "Power-user productivity & import flexibility";
4 concrete items + 1 polish bundle written into GOALS.md:
P7.A (Recurring EDIT), P7.B (Undo stack single-step), P7.C
(Bank-CSV presets + TD.21 CSV core promotion), P7.D (local
categorization heuristics, DB v5→v6 + backup schema 2→3), P7.E
(polish/cleanup-bundle, optional). Calendar-view tab deferred
to Phase 8.

Stage: S3 (Phase 7 OPEN) — see `.loop/state.json`
  (`pr_mode: true`, `pr_size_policy: fat`)
Next step: iter-034 — **P7.A + P7.B fat-iter**. Two parallel
  Class B sub-agents with disjoint file allowlists:
    - P7.A owns RecurringManager (+ optional new RecurringForm)
    - P7.B owns new useUndoStack hook + UndoToast component +
      App.tsx mutation-handler wiring.
  App.tsx may need main-agent integration if P7.A and P7.B
  collide there (established pattern).
Open first (for iter-034):
  - P7.A: `src/components/RecurringManager.{tsx,test.tsx,css}`,
    potentially new `src/components/RecurringForm.{tsx,test.tsx,css}`.
  - P7.B: new `src/hooks/useUndoStack.{ts,test.ts}`, new
    `src/components/UndoToast.{tsx,test.tsx,css}`, `src/App.tsx`
    (push inverses into every mutation handler).
Open blocks: none. iter-033 produced no review (planning iter,
  no code, no sub-agents).

Test gate: 628 tests pass (unchanged from iter-032). No build
  run (no code). Lint untouched.
Push: planning commit goes straight to main (no feature
  shipped → no PR per feature-pr-mode.md scope).

Last-iter shipped (planning, no PR):
- `GOALS.md` — `## Phase 7 — Power-user productivity & import
  flexibility` section with P7.A..P7.E concrete items + Phase
  8 deferral block + iter cadence plan.
- `logs/iter-033.md` — planning rationale + iter-034 handoff.
- `logs/latest.md` — refreshed for iter-034.
- `.loop/state.json` — iter 32 → 33.

Operational notes for iter-034:
  - **Cadence:** 600s (impl-iter; fat-iter with 2 parallel
    Class B sub-agents).
  - **Process-fix held**: explicit-path staging on every commit.
    Nineteen-iter streak.
  - `vite.config.ts` `fileParallelism: false` still
    load-bearing.
  - **localStorage shim centralised** in `src/test/setup.ts`.
  - **Seams in play (post-iter-033):** `store.ts` (IDB),
    `useStoredCollection` (hook), `errorMessages.ts`
    (messaging), `currency.ts` (formatter), `downloadFile.ts`
    (download), `useFilePicker.ts` + `useParsedFileImporter.ts`
    (import), `FieldError.tsx` (a11y error slot). iter-034
    adds `useUndoStack.ts` (mutation-inverse channel) and
    potentially `RecurringForm.tsx` (form consolidation).
  - **DB version still 5**, backup `BACKUP_SCHEMA_VERSION`
    still 2. iter-034 is presentation/hook-layer; schema bump
    waits for iter-036 (P7.D).

Open questions for iter-034:
  (1) Extract `<RecurringForm>` (like `<ExpenseForm>`) or
      inline-edit fields in RecurringManager rows? Lean:
      extract — earns locality at 2 consumers (add path +
      edit path).
  (2) UndoToast position: bottom-center fixed vs top-right
      slide-in? Lean: bottom-center fixed (mobile-first;
      doesn't collide with header).
  (3) Auto-dismiss timeout: 5s vs 6s vs 8s? Lean: 6s
      (Material Design Snackbar guidance).
  (4) Toast queue policy: stack multiple inverses or
      only-latest? Lean: only-latest — single-step undo,
      new mutation REPLACES pending undo.
  (5) Should RESTORE push an undo action? Lean: NO
      (already destructive-with-dialog; undo for a destructive
      data-replace would confuse the dialog gate).
