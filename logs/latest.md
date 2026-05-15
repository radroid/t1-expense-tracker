# Latest

Latest: iter-034 — **P7.A recurring EDIT + P7.B undo stack shipped
(PR #69).** Fat-iter, two disjoint parallel Class B sub-agents.
Recurring templates gain inline Edit/Save/Cancel. New
`useUndoStack` + `<UndoToast>` (polite, 6s) wires undo across 8
mutation surfaces (delete/edit/rename/set in; add/bulk/restore
out). 668 tests pass (+40). Super-reviewer critical (category-
budget id separator) fixed in-iter; CodeRabbit Major (edit-form
can't clear categoryId) deferred with documented workaround.

Stage: S3 (Phase 7 in progress, 2/4 features done) — see
  `.loop/state.json` (`pr_mode: true`, `pr_size_policy: fat`).
  **Loop paused after iter-034 per user request.**

Next step (when loop resumes): iter-035 — **P7.C solo iter
(Bank-CSV presets + TD.21 CSV core promotion).** Extract shared
tokenizer/csvQuote/headerMatches from `csv.ts` + `recurringCsv.ts`
into `src/lib/csvCore.ts` (3rd consumer arrives → 3-consumer rule
satisfied). New `src/lib/bankPresets.ts` (declarative
`BankPreset = {id, label, headerSig, columnMap, signConvention}`)
+ `detectPreset(headerRow)` + preset selector in ImportButton.

Open first (for iter-035):
  - `src/lib/csv.ts` + `src/lib/recurringCsv.ts` (extract shared
    core).
  - New `src/lib/csvCore.{ts,test.ts}`.
  - New `src/lib/bankPresets.{ts,test.ts}`.
  - `src/components/ImportButton.{tsx,test.tsx}` (preset
    selector UI).

Open blocks: none critical. iter-034 super-reviewer (REQUEST_
  CHANGES → resolved) + iter-034 CodeRabbit (1 Major deferred,
  workaround exists) logged under `## iter-034` sections in
  `logs/blocks.md`.

Test gate: 668 tests pass. Build main JS 236.12 kB / gzip
  72.69 kB. Lint clean.
Push: PR #69 squash-merged. **Loop NOT scheduled — paused at
  user request.**

Last-iter shipped (PR #69):
- `src/lib/recurring.ts` — `applyRecurringTemplateEdit(existing,
  input)` (id + frequency preservation; categoryId omit-vs-
  undefined per TD.2).
- `src/db/recurringTemplateStore.ts` — new `putRecurringTemplate`
  via existing `makeStore` factory.
- `src/hooks/useRecurringTemplates.ts` — surfaces `update` via
  `useStoredCollection.validateUpdate`.
- `src/components/RecurringManager.tsx` — inline Edit/Save/Cancel
  per row; shared `parseDraft` helper between add + edit; per-
  field a11y wiring preserved.
- `src/hooks/useUndoStack.ts` (new) — single-step push-replaces
  semantics, 7 specs.
- `src/components/UndoToast.{tsx,test.tsx,css}` (new) — polite
  snackbar, auto-dismiss 6s, bottom-center fixed, themable, 7
  specs.
- `src/App.tsx` — 8 mutation surfaces wrapped with undo-pushing
  closures; canonical `categoryBudgetId()` helper used for
  category-budget undo inverse (super-reviewer Critical #1
  fix); regression test added.

Operational notes for iter-035 (when resumed):
  - **Cadence:** 600s (impl-iter — P7.C is solo, no parallel
    sub-agent dispatch needed).
  - **Process-fix held**: explicit-path staging on every
    commit. Nineteen-iter streak.
  - `vite.config.ts` `fileParallelism: false` still
    load-bearing.
  - **Seams in play (post-iter-034):** `store.ts` (IDB),
    `useStoredCollection` (hook), `errorMessages.ts`
    (messaging), `currency.ts` (formatter), `downloadFile.ts`
    (download), `useFilePicker.ts` + `useParsedFileImporter.ts`
    (import), `FieldError.tsx` (a11y error slot),
    `useUndoStack.ts` (undo channel). iter-035 adds
    `csvCore.ts` (3rd CSV consumer) and `bankPresets.ts`
    (preset declarations).
  - **DB version still 5**, backup `BACKUP_SCHEMA_VERSION`
    still 2. iter-035 stays presentation/lib-layer. Schema
    bump waits for iter-036 (P7.D).

Open questions for iter-035 (when resumed):
  (1) Preset auto-detect by header signature, or manual select
      only? Lean: auto-detect with manual fallback (user
      experience).
  (2) Which presets in v1? Lean: Chase (CSV format from
      chase.com export), generic (4-column app format, the
      current default), and one "Custom" hand-map option.
  (3) Sign convention — bank statements typically have
      Withdrawals as positive numbers; our app stores
      expenses as positive amounts. Presets need
      `signConvention: 'positive-amount' | 'withdrawals-
      column'` etc. Lean: explicit per-preset.

Carry-forward known-limitations from iter-034 (low priority):
  - Edit form can't clear existing recurring categoryId
    (CR Major, deferred — workaround: delete + re-add).
  - Re-added entities mint fresh UUIDs (delete-undo).
  - Recurring delete-undo / rollover race (niche window).
  - Budget set + same-value undo phantom (minor UX).
  - Inverse-failure silently warns to console.
