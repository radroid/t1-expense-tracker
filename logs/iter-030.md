# iter-030

**Phase:** Phase 6 → Phase 7 boundary — **mandatory arch pass**
· **Mode:** thinking-iter (no code shipped) · **pr_mode:** true

## What ran

1. Loaded `autonomous-build-loop` skill (Tier-1 protocol read).
2. Invoked `improve-codebase-architecture` skill — **real tool
   call**, per the phase-boundary hard rule.
3. Dispatched an Explore agent for an organic codebase walk
   (5 stores + factory + 19 lib modules + 5 domain hooks + 27
   components + App.tsx integration hub).
4. Logged 7 candidates + existing-TD verdicts + 5 Phase 7 theme
   proposals to `logs/blocks.md` under `## iter-030 — Phase-6 →
   Phase-7 arch pass` with `**Source:** arch-pass`.

No production code touched. Test count unchanged at 588.

## Candidates surfaced

| # | Candidate | TD | Verdict |
|---|---|---|---|
| 1 | `downloadFile` adapter | TD.13 (reshape) | 🟢 PICK iter-031 |
| 2 | `useFilePicker` + `parsedFileImporter` (TD.14 split) | TD.14 (reshape) | 🟢 PICK iter-031 |
| 3 | CSV core concentration | TD.21 (NEW) | 🟡 promote when 3rd CSV consumer lands |
| 4 | App.tsx integration-hub split | TD.22 (NEW) | 🟡 reassess at P7→P8 |
| 5 | Multi-hook error consolidation | TD.23 (NEW) | 🟡 bundle with TD.20 |
| 6 | `bindStore` helper | TD.24 (NEW) | 🟡 cleanup-bundle only |

Re-evaluated prior deferrals: **TD.10** (expenseVisibility) — still
no non-React consumer; useMemo granularity is a feature.
**TD.12** (refresh-after-mutation isolation) — 5 consumers, 12
iters stable, zero reports. Both continue deferred. **TD.15**
(backupPipeline barrel) — no schema-evolution pressure; v2 stable.

## Decisions

- **iter-031 = TD.13 + TD.14 fat-iter.** Sibling export/import
  seams, same testing pattern, both unblocked by the 3-consumer
  rule. Natural pair.
- **iter-032 = a11y-P1 bundle.** TD.18 (form-error-association,
  5 forms) + TD.19 (skip-link) + TD.20 (persistent error region)
  + TD.23 (multi-error consolidation). Coherent independent
  sweep; same surface area (App.tsx + forms).
- **iter-033 = Phase 7 planning iter.** After the two refactor
  iters land, triage Phase 7 themes into concrete `P7.A`..`P7.E`
  items.
- **Phase 7 theme leans:** Pick 2-3 feature items + the iter-032
  polish bundle. Feature momentum strong; codebase healthy. The
  bank-CSV preset feature naturally unlocks TD.21.

## Operational notes

- Process-fix held: explicit-path staging on every commit.
  Sixteen-iter streak.
- `vite.config.ts` `fileParallelism: false` still load-bearing.
- localStorage shim still centralised in `src/test/setup.ts`.
- Main bundle 231.67 kB / gzip 71.37 kB (post-P6.D code-split).

## Wake-up handoff

- **Current phase:** Phase 6 CLOSED. Phase 7 stub written;
  concrete items TBD by iter-033.
- **Next step:** **iter-031 — fat-iter shipping TD.13 + TD.14.**
  - **TD.13 (`downloadFile` adapter):** new
    `src/lib/downloadFile.ts` exports `downloadFile({filename,
    mime, body})`. `ExportButton`, `BackupExport`,
    `RecurringExport` collapse to one-liner each + filename.
    Pair the Blob-revoke race fix here (use async revoke or
    delayed teardown).
  - **TD.14 (split):**
    - `src/hooks/useFilePicker.ts` — thin hook owning ref-reset
      + `file.text()` boilerplate.
    - `src/lib/parsedFileImporter.ts` (or `src/hooks/useParsedFileImporter.ts`)
      — orchestrator for headerErr/summary state shape.
    - `ImportButton` + `RecurringImport` adopt both;
      `BackupRestore` adopts only `useFilePicker` (keeps its
      dialog logic in-place).
- **Cadence:** 600s (impl-iter — concrete refactor work).
- **Files to open first for iter-031:**
  - `src/components/ExportButton.tsx`, `BackupExport.tsx`,
    `RecurringExport.tsx` (TD.13 consumers).
  - `src/components/ImportButton.tsx`, `RecurringImport.tsx`,
    `BackupRestore.tsx` (TD.14 consumers).
  - `logs/blocks.md` ## iter-030 section for the full candidate
    rationale + deletion-test analysis.
- **Open questions for iter-031:**
  (1) Inject `document`/`URL` for `downloadFile` testability, or
      stub via vitest? Lean: inject — keeps the lib pure-ish.
  (2) Should `parsedFileImporter` be a hook or a pure factory?
      Lean: hook — it owns React state (headerErr, summary).
  (3) Pair the Blob-revoke race fix with TD.13 in the same PR,
      or separate? Lean: same PR — the fix lives at the seam.
- **Carry-forward (full):** TD.6 closed; TD.10 (expenseVisibility
  pipeline — still no non-React consumer); TD.12
  (refresh-after-mutation isolation); TD.15 (backupPipeline
  barrel — deferred); TD.17 (App guard test gap); TD.18 (form-
  error-association — iter-032 bundle); TD.19 (skip-link —
  iter-032); TD.20 (persistent error region — iter-032); TD.21
  (CSV core — promote when 3rd consumer lands); TD.22 (App
  integration-hub split — reassess P7→P8); TD.23 (multi-error
  consolidation — iter-032 bundle); TD.24 (`bindStore` —
  cleanup-bundle); deferred `useSpendingByCategory` typing pair-
  up; DateRangeFilter from>to normalize; CSV-injection
  prefix-escape; filename-vs-exportedAt timezone skew.
