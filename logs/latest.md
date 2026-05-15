# Latest

Latest: iter-030 — **Phase 6 → Phase 7 mandatory arch pass.**
Six candidates surfaced (TD.13 reshape + TD.14 split + TD.21
CSV core + TD.22 App-split + TD.23 multi-error + TD.24
bindStore); two promoted to PICK for iter-031 (TD.13 + TD.14,
both unblocked by the 3-consumer rule). a11y-P1 bundle
(TD.18 + TD.19 + TD.20 + TD.23) targeted at iter-032. Phase 7
stub added to GOALS.md with 5 theme proposals; concrete items
TBD by iter-033 planning. No production code shipped this iter.

Stage: S3 (Phase 7 starting; pre-Phase-7 arch-driven refactors
  pending) — see `.loop/state.json` (`pr_mode: true`,
  `pr_size_policy: fat`)
Next step: iter-031 — **fat-iter shipping TD.13 + TD.14**.
  Sibling export/import seams; same testing pattern; both
  unblocked. Two parallel Class B sub-agents with disjoint
  allowlists (TD.13 owns the 3 Export components + new lib;
  TD.14 owns the 3 Import-style components + new hook + lib).
Open first (for iter-031):
  - `src/components/ExportButton.tsx`, `BackupExport.tsx`,
    `RecurringExport.tsx` (TD.13 consumers — Blob+anchor+revoke
    dance + `todayIsoDate` helper duplicated in all three).
  - `src/components/ImportButton.tsx`, `RecurringImport.tsx`,
    `BackupRestore.tsx` (TD.14 consumers — file-picker→parse→
    execute; BackupRestore additionally has dialog/atomic
    restore).
  - `logs/blocks.md` ## iter-030 section for the candidate
    rationale + deletion-test analysis + Phase 7 theme list.
Open blocks: none open. Arch pass logged under `## iter-030 —
  Phase-6 → Phase-7 arch pass` with `**Source:** arch-pass`.

Test gate: 588 tests pass (unchanged — thinking iter).
Push: PR #65 (iter-030 arch-pass closeout) — see `gh pr view 65`
  after merge.

Last-iter shipped: nothing (thinking-iter). Deliverables:
  - `logs/blocks.md` ## iter-030 (7 candidates + deletion-test
    analysis + existing-TD verdicts + Phase 7 theme list).
  - `GOALS.md`: TD.13 + TD.14 reshaped/promoted; TD.21/22/23/24
    added as new entries; Phase 7 stub written with 5 theme
    proposals; sequencing recommendation included.
  - `logs/iter-030.md` (wake-up handoff for iter-031).
  - `.loop/state.json` bumped to iter 30.

Operational notes for iter-031:
  - **Cadence:** 600s (impl-iter — concrete refactor work).
  - **Process-fix held**: explicit-path staging on every commit.
    Sixteen-iter streak. Keep it up.
  - `vite.config.ts` `fileParallelism: false` still load-bearing.
  - **localStorage shim centralised** in `src/test/setup.ts`.
  - **Seams in play (stable):** `store.ts` (IDB), `useStoredCollection`
    (hook), `errorMessages.ts` (messaging), `currency.ts`
    (formatter). iter-031 ADDS two new seams: `src/lib/downloadFile.ts`
    + `src/hooks/useFilePicker.ts` + (optionally) `src/lib/parsedFileImporter.ts`.
  - **DB version still 5**, backup `BACKUP_SCHEMA_VERSION` still
    2 — pure-refactor iter; no schema changes expected.
  - **Sub-agent split for iter-031 fat-iter:**
    - Class B #1 (TD.13): owns `src/lib/downloadFile.{ts,test.ts}`
      (new); `src/components/ExportButton.tsx` +
      `BackupExport.tsx` + `RecurringExport.tsx` (collapse). Pair
      with the Blob-revoke race fix.
    - Class B #2 (TD.14): owns `src/hooks/useFilePicker.{ts,test.ts}`
      (new); `src/lib/parsedFileImporter.{ts,test.ts}` or
      `src/hooks/useParsedFileImporter.{ts,test.ts}` (new);
      `src/components/ImportButton.tsx` + `RecurringImport.tsx`
      (collapse to wiring); `BackupRestore.tsx` (adopt only
      `useFilePicker`).

Open questions for iter-031:
  (1) Inject `document`/`URL` into `downloadFile` for testability,
      or stub via vitest? Lean: inject — keeps the lib pure-ish.
  (2) Is `parsedFileImporter` a hook or a pure factory? Lean:
      hook — it owns React state (headerErr, summary).
  (3) Pair the Blob-revoke race fix with TD.13 in the same PR,
      or split? Lean: same PR — the fix lives at the seam.
  (4) `todayIsoDate` helper — currently duplicated in 3 export
      components. Land it in `src/lib/date.ts` or extend
      `src/lib/month.ts` with an `isoDateToday()` export? Lean:
      extend `month.ts` (already date-string-shaped).
