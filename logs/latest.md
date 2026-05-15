# Latest

Latest: iter-031 — **TD.13 + TD.14 fat-iter shipped (PR #67).**
Two sibling export/import refactors from the iter-030 arch pass.
TD.13 lifts Blob+anchor+revoke into `src/lib/downloadFile.ts`
(Safari/Firefox revoke-race fix at the seam). TD.14 splits the
file-picker pattern into `useFilePicker` (thin) +
`useParsedFileImporter` (orchestrator); BackupRestore keeps its
dialog logic. 606 tests pass (+18). Main bundle 232.11 kB / gzip
71.61; lazy chunks shrank from consolidation.

Stage: S3 (pre-Phase-7 refactors continuing) — see
  `.loop/state.json` (`pr_mode: true`, `pr_size_policy: fat`)
Next step: iter-032 — **a11y-P1 sweep**. TD.18 (form-error-
  association across 5 forms) + TD.19 (skip-link) + TD.20
  (persistent error live region) + TD.23 (multi-hook error
  consolidation). Coherent sweep across form + App.tsx error
  surfaces. Single PR.
Open first (for iter-032):
  - TD.18: `BudgetForm.tsx`, `ExpenseForm.tsx`,
    `CategoryManager.tsx`, `CategoryBudgetManager.tsx`,
    `RecurringManager.tsx` (+ tests). Consider new
    `src/components/FieldError.{tsx,test.tsx,css}` helper.
  - TD.19: `src/App.tsx` (skip-link rendering) +
    `src/index.css` (focus-visible styling).
  - TD.20 + TD.23: `src/App.tsx` (error fan-in + persistent
    live region).
Open blocks: none. iter-031 super-reviewer logged under
  `## iter-031 — super-reviewer (fat-iter: TD.13 + TD.14)` with
  APPROVE-WITH-NITS high-confidence. Three minor nits captured
  for carry-forward.

Test gate: 606 tests pass. `npm run build` main JS 232.11 kB /
  gzip 71.61 kB. Lazy: RecurringManager 5.84 (was 6.43);
  BackupRestore 4.64 (was 4.80). Lint clean.
Push: PR #67 squash-merged.

Last-iter shipped (PR #67):
- `src/lib/downloadFile.{ts,test.ts}` (new; 6 specs) — Blob+
  anchor+revoke adapter with optional injection bag for
  testability. Safari/Firefox revoke-race fix via
  `setTimeout(fn, 0)` scheduler default.
- `src/lib/month.ts` — added `isoDateToday(now?: Date): string`
  (UTC, +3 specs). Replaces 3 duplicated local-date helpers
  in the export components.
- `src/hooks/useFilePicker.{ts,test.ts}` (new; 4 specs) — thin
  hook owning ref-reset + `file.text()`. Reset BEFORE awaiting
  onFile so same-file re-pick fires.
- `src/hooks/useParsedFileImporter.{ts,test.ts}` (new; 5 specs)
  — orchestrator owning headerError/summary/rowErrors with
  parse + import error composition.
- 3 export components collapse to one-liner `downloadFile({...})`
  calls. 2 import components collapse (ImportButton 94→62 LOC;
  RecurringImport 102→76 LOC). BackupRestore adopts only
  `useFilePicker` (dialog logic preserved).

Operational notes for iter-032:
  - **Cadence:** 600s (impl-iter).
  - **Process-fix held**: explicit-path staging on every commit.
    Seventeen-iter streak.
  - `vite.config.ts` `fileParallelism: false` still
    load-bearing.
  - **localStorage shim centralised** in `src/test/setup.ts`.
  - **Seams in play (post-iter-031):** `store.ts` (IDB),
    `useStoredCollection` (hook), `errorMessages.ts`
    (messaging), `currency.ts` (formatter), `downloadFile.ts`
    (download), `useFilePicker.ts` + `useParsedFileImporter.ts`
    (import). iter-032 may add `FieldError` (visual a11y seam)
    if scope earns it.
  - **DB version still 5**, backup `BACKUP_SCHEMA_VERSION`
    still 2. iter-032 is presentation-layer.
  - **a11y context from iter-028:** 13 P0 + 8 P1 + 8 P2
    findings; P0 cluster shipped. The P1 cluster targets
    form-error-association — already enumerated as
    a11y-016..a11y-019 in `logs/blocks.md` ## iter-028.
    Class B can implement directly without a re-audit.

Open questions for iter-032:
  (1) `<FieldError>` component vs convention? Lean:
      component at 5 consumers; small surface, earns
      locality.
  (2) Audit-first vs spec-and-impl? Lean: spec-and-impl
      since iter-028 audit already enumerated. No re-audit
      needed.
  (3) Single PR or split a11y-P1 + multi-error? Lean: single
      PR — all touch error/feedback surfaces.
  (4) `errors: string[]` collector at App.tsx — render as
      `<ul>` (verbose) or join with `· ` (compact)? Lean:
      join with `· ` separator (matches iter-028 audit
      a11y-007 suggestion).
