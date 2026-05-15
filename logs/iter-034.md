# iter-034

**Phase:** Phase 7 (Power-user productivity & import flexibility)
· **Mode:** fat-iter (2 features, 1 PR) · **pr_mode:** true

## Features landed (PR #69)

- **P7.A — Recurring-template EDIT.** New `applyRecurringTemplateEdit`
  lib helper (id + frequency preservation; categoryId omit-vs-
  undefined per TD.2). New `putRecurringTemplate` store method via
  the existing `makeStore` factory. `useRecurringTemplates.update`
  surfaces via `useStoredCollection.validateUpdate`. RecurringManager
  gained inline Edit/Save/Cancel per row + shared `parseDraft`
  helper between add + edit forms. Per-field a11y wiring
  (`aria-invalid`, `aria-describedby`, `<FieldError>`) preserved
  in the edit form.
- **P7.B — Undo stack (single-step last-mutation).** New
  `useUndoStack` hook ({pending, push, undo, dismiss}; push
  REPLACES). New `<UndoToast>` snackbar (`role="status"`,
  `aria-live="polite"`, auto-dismiss 6s, bottom-center fixed,
  themable via `--app-*`). App.tsx wraps 8 mutation surfaces:
  expense delete/edit, category rename/delete, monthly-budget
  set, category-budget set, recurring delete/edit. Centralized
  push at App handlers; per-domain inverse closures captured at
  mutation time.

Final gate: **668 tests pass** (628 → 668, +40). Main JS 236.12
kB / gzip 72.69 kB (+3.05/0.75 from baseline; expected — undo
hook + toast + 8 handler wrappers). RecurringManager lazy chunk
5.84 → 8.69 kB (edit form). Lint clean.

## How it went

- Two parallel Class B sub-agents with disjoint allowlists.
  P7.A owned `lib/recurring` + `db/recurringTemplateStore` +
  `hooks/useRecurringTemplates` + `RecurringManager`; P7.B
  owned new `useUndoStack` + new `UndoToast` + `App.tsx`. Zero
  collision.
- Super-reviewer (Class A) REQUEST_CHANGES → resolved in-iter.
  One real bug: App.tsx category-budget undo inverse used
  `${month}:${categoryId}` (colon) instead of the canonical
  `categoryBudgetId(month, categoryId)` helper (pipe). Silently
  no-op'd the inverse when prior amount was undefined. Fixed
  + regression test added.
- CodeRabbit raised one Major nit (edit form can't clear an
  existing categoryId because `parseDraft` omits-when-empty +
  `applyRecurringTemplateEdit` preserves-on-undefined). Deferred
  to P7.E or a follow-up TD — workaround exists (delete +
  re-add). Logged in `blocks.md`.
- Process-fix held: explicit-path staging on every commit.
  Nineteen-iter streak.

## Decisions / notes

- **Undo coverage is INTENTIONALLY non-uniform.** Delete + edit +
  rename + set surfaces are in; add + bulk + restore are out.
  Rationale: (a) `useStoredCollection.add` returns `Promise<boolean>`
  not the entity, so capturing the new id for an "undo add"
  inverse requires a hook-contract change touching 5 hooks;
  (b) "undo add" is functionally identical to clicking the
  Delete button on the just-added row; (c) bulk import and
  restore are already dialog-confirmed or out-of-charter.
- **Re-added entities mint fresh UUIDs.** Delete-undo on
  expense/category/recurring re-adds via the input shape, so
  the new entity has a new id. Acceptable v1 trade-off — the
  user sees their row come back; no downstream code in this
  codebase pins to a specific deleted id. Future hook
  enhancement: per-hook `restore(entity)` that preserves the
  full entity including id.
- **Recurring delete-undo can race against the rollover effect.**
  Niche window: delete a rolled-over expense → rollover effect
  re-flags template as due → effect fires `addMany` → user
  clicks Undo within 6s → duplicate present. Documented as
  known limitation; future inverse should check for existing
  sourceTemplateId match before re-adding.
- **UndoToast uses `role="status"` (polite), `app__error` is
  `role="alert"` (assertive).** Correct routing — undo
  announcements don't interrupt error narration. Cross-feature
  concern resolved.
- **Single-step undo by design, not multi-step.** Push REPLACES.
  Avoids the redo-tree-after-mutation question that bloats a
  multi-step stack into a mini-DAG.
- **Loop user-paused after iter-034.** User requested stop after
  the necessary changes — `ScheduleWakeup` NOT called this iter.

## Carry-forward

- **Critical/Warning-class:** none open. Critical (category-budget
  separator bug) fixed in-iter.
- **Known limitations from this iter** (low-priority follow-ups):
  - Edit form can't clear an existing recurring categoryId
    (deferred — workaround: delete + re-add). CR Major.
  - Re-added entities mint fresh UUIDs (delete-undo). Documented.
  - Recurring delete-undo / rollover race (niche window).
    Documented.
  - Budget set + same-value undo pushed unconditionally (minor
    UX phantom; category rename guards correctly).
  - Inverse failure silently warns to console (no error
    feedback yet).
- **Tail (unchanged from iter-033):** TD.10, TD.12, TD.15,
  TD.17, TD.22, TD.24, deferred `useSpendingByCategory`
  typing, DateRangeFilter from>to normalize, CSV-injection
  prefix-escape, filename-vs-exportedAt timezone skew,
  `useFilePicker.ts:38` unreachable fallback,
  `downloadFile.ts:54-58` SSR guard untested.

## Wake-up handoff (when loop resumes)

- **Phase 7 progress:** P7.A + P7.B done (1 iter). Remaining:
  P7.C (Bank-CSV presets + TD.21 promotion), P7.D (Local
  categorization heuristics + DB v6), P7.E (polish bundle,
  optional). Calendar deferred to Phase 8.
- **Next step (when loop resumes):** iter-035 — **P7.C solo iter**.
  Promotes TD.21 (CSV core concentration) — `csv.ts` and
  `recurringCsv.ts` share a 60-LOC tokenizer + csvQuote +
  headerMatches; lift to new `src/lib/csvCore.ts`. New
  `src/lib/bankPresets.ts` + preset selector UI in
  ImportButton.
- **Cadence (when resumed):** 600s (impl-iter).
- **Files to open first for iter-035:**
  - `src/lib/csv.ts` + `src/lib/recurringCsv.ts` (the two
    existing CSV consumers — extract their shared core).
  - New `src/lib/csvCore.ts` + `src/lib/csvCore.test.ts`.
  - New `src/lib/bankPresets.ts` + `src/lib/bankPresets.test.ts`.
  - `src/components/ImportButton.tsx` + test (preset selector
    UI).

## Push: PR #69 squash-merged.
