# Latest

Latest: iter-029 — **P6.D perf/bundle pass shipped (PR #64).**
React.lazy() split on CategoryManager + RecurringManager +
BackupRestore. Main JS 242.80 → 231.67 kB (gzip 72.92 → 71.37).
Main CSS 26.74 → 21.40 kB. Three on-demand chunks now defer
~13 kB JS + 5 kB CSS until needed. 588 tests still pass without
modification. **Phase 6 CLOSED**: all 5 items done (P6.A
recurring CSV, P6.B trends/year view, P6.C a11y P0 cluster,
P6.D perf split, P6.E category-delete cascade).

Stage: S3 (Phase 6 → Phase 7 boundary) — see `.loop/state.json`
  (`pr_mode: true`, `pr_size_policy: fat`)
Next step: iter-030 — **MANDATORY PHASE-BOUNDARY ARCH PASS**.
  Hard rule from the loop protocol: before any Phase 7 feature
  work, invoke the `improve-codebase-architecture` skill (real
  tool call, not concept), surface deepening opportunities, and
  log results to `logs/blocks.md` with `**Source:** arch-pass`.
  The arch pass output drives any pre-Phase-7 refactor and shapes
  the Phase 7 backlog in `GOALS.md` (currently empty — Phase 6
  is the last defined phase).
Open first (for arch-pass context): `GOALS.md` (Phase 7 stub TBD;
  arch-pass produces it); `logs/iter-023.md` + `logs/iter-017.md`
  (the two previous phase-boundary arch passes — pattern
  reference); `logs/blocks.md` ## iter-023 + ## iter-028 +
  ## iter-029 sections.
Open blocks: none. iter-029 super-reviewer logged with APPROVE
  high-confidence; CodeRabbit zero inline findings.

Test gate: 588 tests pass. Main bundle now 231.67 kB / gzip
  71.37 kB. Lint clean.
Push: PR #64 squash-merged.

Last-iter shipped (PR #64): App.tsx adds `lazy` + `Suspense`
  imports; converts 3 named-export imports to `lazy()` adapters
  using `.then((m) => ({ default: m.X }))`; wraps each call-site
  in `<Suspense fallback={<Spinner size="sm" />}>`. Three
  per-component Suspense boundaries sit inside the existing
  `!loading` branch so a11y-012 invariant holds.

Carry-forward candidates the iter-030 arch pass should consider:
  - **TD.13 (`makeDownloadBlob`)** — 3rd-consumer-rule MET (3
    consumers: ExportButton, BackupExport, RecurringExport).
    Strong pickup candidate.
  - **TD.14 (`useFileRestoreFlow`)** — 3rd-consumer-rule MET (3
    consumers: ImportButton, BackupRestore, RecurringImport).
    Strong pickup candidate.
  - **TD.18 (form-error-association sweep)** — coherent
    independent sweep across 5 forms; good arch-pass pickup.
  - **CSV tokenizer duplication** between `csv.ts` and
    `recurringCsv.ts` — flagged as future lift; arch pass may
    decide.
  - TD.10 (expenseVisibility pipeline) — recheck for non-React
    consumer.
  - TD.15 (backupPipeline barrel) — defer unless schema
    evolution lands.
  - TD.17 (App guard test gap), TD.19 (skip-link), TD.20
    (persistent error region) — small-scoped follow-ups.

Operational notes for iter-030:
  - **PHASE BOUNDARY** — Hard rule. Invoke `Skill` tool with
    `skill: "improve-codebase-architecture"` as the FIRST
    action. Real tool call, NOT just reading the doc and
    improvising.
  - **Cadence:** 1500s (plan-iter — arch pass is thinking work).
  - **Process-fix held**: explicit-path staging on every commit.
    Sixteen-iter streak. Keep it up.
  - `vite.config.ts` `fileParallelism: false` still
    load-bearing.
  - **localStorage shim centralised** in `src/test/setup.ts`.
  - **NEW seams to evaluate at the arch pass:** lazy/Suspense
    pattern just introduced. Does any other surface earn a
    code-split (e.g. `CategoryBudgetManager`, the chart
    components)? Probably no — they're frequently on-screen.
  - **DB version is 5**, backup `BACKUP_SCHEMA_VERSION` is 2,
    `useStoredCollection` is the hook seam, `errorMessages.ts`
    is the messaging seam, `currency.ts` is the formatter seam,
    `store.ts` is the IDB seam — all stable.

Open questions for iter-030 (arch pass):
  (1) TD.13 + TD.14 both now have 3 consumers. Pick BOTH for
      iter-031, or one first to validate the seam before the
      other?
  (2) Should the audit-first pattern that worked for iter-028's
      a11y sweep apply here? (Class A audit, then implement.)
      Lean: yes — the arch pass IS audit-first by nature; the
      iter-028 success reinforces this.
  (3) Phase 7 themes — needs product input + architectural
      perspective on what's worth shipping next. Hard
      constraint: still local-only by CLAUDE.md charter (no
      backend / network). Realistic themes: AI-assisted
      categorization heuristics, savings goals, recurring-
      template edit-not-just-add, multi-account/wallet
      separation, undo stack, import-from-bank-CSV-format
      preset, calendar-view tab.
  (4) Is the app now feature-rich enough that Phase 7 should
      be a polish/internal-quality phase (form errors, perf,
      docs) rather than features? Lean: arch pass triages
      this.
