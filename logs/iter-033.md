# iter-033

**Phase:** Phase 7 OPEN (planning iter) · **Mode:** bookkeeping
(no code, no PR, no sub-agents) · **pr_mode:** true (n/a this iter)

## What landed

Concrete `P7.A..P7.E` items written into `GOALS.md`. Phase 7
titled **Power-user productivity & import flexibility**. Cadence
plan: 3 feature iters + 1 optional polish iter.

- **P7.A — Recurring-template EDIT** (small/medium). Inline
  Edit/Save/Cancel in RecurringManager mirroring ExpenseForm
  pattern. No schema. Pairs cleanly with P7.B in iter-034.
- **P7.B — Undo stack (single-step last-mutation)**. New
  `useUndoStack` hook + `<UndoToast>` snackbar. Centralized
  push, per-domain inverse closures. Excludes RESTORE
  (already dialog-confirmed). No schema.
- **P7.C — Bank-CSV import presets** (medium). Promotes TD.21
  (CSV core) via new `src/lib/csvCore.ts`; new
  `src/lib/bankPresets.ts` + preset selector in ImportButton.
  No schema.
- **P7.D — Local categorization heuristics** (heavy — solo iter).
  Pure `suggestCategory()` lib + new `categorizationRules` IDB
  store (DB v5→v6, BACKUP_SCHEMA_VERSION 2→3). Applied at
  ExpenseForm + ImportButton.
- **P7.E — Polish/cleanup-bundle** (end-of-phase or
  carry-forward). TD.12 + TD.17 + TD.24 + iter-032 nits.

Deferred to Phase 8: **Calendar-view tab** — cosmetic; low
locality leverage; revisit after A..D land.

## How it went

- Pure planning. Followed `latest.md` handoff leans nearly
  verbatim — the iter-032 super-reviewer + post-arch handoff
  already converged on these picks. Calendar was the only
  unambiguous defer.
- Iter cadence picked: iter-034 = A+B fat-iter (allowlists are
  disjoint — RecurringManager + RecurringForm vs new hook +
  toast component); iter-035 = C solo (TD.21 promotion + new
  preset module); iter-036 = D solo (schema bump + entity +
  2 integration points).

## Decisions / notes

- **P7.B scope = single-step undo, not multi-step.** The
  invariants for a multi-step stack get harder fast (what
  happens to the redo branch when a NEW mutation lands after
  undo? Does the stack persist across reloads?). Single-step
  is honest about the "oops, undo that one thing" UX without
  pretending to be a transactional log.
- **RESTORE is intentionally excluded from undo.** It already
  has a `<dialog>` confirmation gate (iter-020); the undo
  affordance would be confusing alongside the destructive-warn
  pattern.
- **P7.D requires the second schema bump of the project**
  (first was iter-021 P5.D). Backup `BACKUP_SCHEMA_VERSION`
  bump 2→3 enforces backup-round-trip preservation of rules.
  Restore-of-older-backup needs an explicit
  rules=[] default fallback in the parse layer.
- **TD.21 promotion in P7.C** finally lands the CSV core after
  waiting for the 3rd consumer (today: `csv.ts` for expenses
  + `recurringCsv.ts` for templates; P7.C adds the 3rd via
  `bankPresets.ts`). The 3-consumer rule held.
- **P7.E is genuinely optional.** If Phase 7 stretches to 4+
  iters from per-feature complexity, the polish bundle
  carries forward to Phase 8.
- **No sub-agents this iter.** Planning iters are bookkeeping
  per skill `## When NOT to fat-iter` guidance. Committing
  straight to main (no PR) because no feature ships.

## Wake-up handoff

- **Current phase:** Phase 7 (Power-user productivity & import
  flexibility). 4 features + 1 polish bundle. Calendar deferred.
- **Next step:** iter-034 — **P7.A + P7.B fat-iter**. Two
  parallel Class B sub-agents:
  - **P7.A allowlist:** `src/components/RecurringManager.tsx`,
    `src/components/RecurringManager.test.tsx`, and (if a new
    inline `<RecurringForm>` emerges)
    `src/components/RecurringForm.{tsx,test.tsx,css}`. Reuse
    existing `validateRecurringTemplateInput` —
    don't duplicate.
  - **P7.B allowlist:** `src/hooks/useUndoStack.{ts,test.ts}`,
    `src/components/UndoToast.{tsx,test.tsx,css}`,
    `src/App.tsx` (wire `undo.push(inverse)` into every
    mutation handler) — **and ONLY App.tsx**. Hooks must NOT
    be edited; the inverse is built at the App handler call
    site using each hook's existing CRUD methods.
  - **App.tsx is shared** between TD.B's wiring and any P7.A
    integration touch. Treat App.tsx as a main-agent
    integration point if collision occurs (per established
    pattern from iter-028, iter-031).
- **Cadence:** 600s (impl-iter).
- **Open questions for iter-034:**
  (1) Should P7.A introduce a `<RecurringForm>` (analogous to
      `<ExpenseForm>`) or just inline the edit fields in
      RecurringManager rows? Lean: extract `<RecurringForm>`
      because the add-form already lives in RecurringManager
      and consolidating it earns locality.
  (2) Undo toast UX: bottom-center fixed position vs top-right
      slide-in? Lean: bottom-center fixed (mobile-first,
      doesn't collide with header).
  (3) Undo timeout (auto-dismiss): 5s vs 8s? Lean: 6s
      (matches Material Design Snackbar guidance — long
      enough to react, short enough to not loiter).
  (4) Should the toast queue stack multiple inverses if the
      user mutates rapidly, or always show only the latest?
      Lean: only-latest (single-step undo, not a stack).
      New mutation REPLACES the pending undo.
- **Carry-forward:** TD.10, TD.12, TD.15, TD.17, TD.22, TD.24,
  TD.21 (promotes in P7.C), iter-032 nits, deferred
  `useSpendingByCategory` typing, DateRangeFilter from>to
  normalize, CSV-injection prefix-escape, filename-vs-
  exportedAt timezone skew, `useFilePicker.ts:38`
  unreachable fallback, `downloadFile.ts:54-58` SSR guard
  untested.
