# iter-031

**Phase:** Pre-Phase-7 (arch-driven refactor) · **Mode:** fat-iter
(2 features) · **pr_mode:** true

## Features landed (PR #67)

- **TD.13** — `downloadFile({filename, mime, body}, env?)` in
  `src/lib/downloadFile.ts` lifts Blob+anchor+revoke from 3 export
  components. Optional injection bag for testability. **Safari/Firefox
  revoke-race fix at the seam** (deferred `URL.revokeObjectURL` via
  `setTimeout(fn, 0)` by default). `isoDateToday()` in `month.ts`
  replaces 3 duplicated local-date helpers (UTC).
- **TD.14** — file-picker seam SPLIT (not one fat hook).
  - `useFilePicker({onFile})` thin hook owns ref-reset +
    `file.text()`; all 3 components adopt. Reset happens BEFORE
    awaiting onFile.
  - `useParsedFileImporter<T>({parse, importFn})` orchestrator
    owns headerError/summary/rowErrors; ImportButton +
    RecurringImport adopt. BackupRestore keeps its dialog
    /atomic-restore logic in-place (adopts only `useFilePicker`).
  - ImportButton 94 → 62 LOC; RecurringImport 102 → 76 LOC.

Final gate: **606 tests pass** (588 → 606, +18). Main JS 232.11 kB
/ gzip 71.61 kB (+0.44/0.24 kB from new hook+lib). Lazy chunks
SHRANK: RecurringManager 6.43 → 5.84 kB; BackupRestore 4.80 → 4.64
kB. Lint clean.

## How it went

- Two parallel Class B sub-agents with disjoint allowlists. TD.13
  owned lib/ + Export-side; TD.14 owned hooks/ + Import-side +
  BackupRestore. Zero collision.
- TD.13 returned with a flag that TD.14 was still red on its
  files — expected since they ran in parallel; final integrated
  state confirmed green by main agent.
- Super-reviewer APPROVE-WITH-NITS, high confidence. 3 minor
  non-blocking nits captured (unreachable fallback in
  useFilePicker, untested SSR guard in downloadFile, UTC filename
  observability).
- CodeRabbit: zero inline findings.
- Process-fix held: explicit-path staging on every commit.
  Seventeen-iter streak.

## Decisions / notes

- **UTC filename change is user-observable** near day boundaries.
  Previous local-date implementations would have rendered yesterday's
  date for a few hours after local midnight if the user was east of
  UTC. Now consistent across timezones; documented in `month.ts`
  helper comment.
- **TD.14 was deliberately split into two helpers, not one fat
  `useFileRestoreFlow`.** The arch pass identified that
  BackupRestore's dialog/atomic-restore divergence was meaningful;
  forcing a single hook would have leaked the dialog branch as a
  "no-dialog mode" knob.
- **Revoke-race fix landed at the seam** — concentrating the
  Safari/Firefox `URL.revokeObjectURL` deferral in one place
  (instead of spread across 3 export components) means future
  browser-quirk handling lands once.

## Wake-up handoff

- **Current phase:** Pre-Phase-7 refactors continuing. iter-032
  ships the a11y-P1 bundle.
- **Next step:** iter-032 — **a11y-P1 sweep**. Per the iter-030
  arch pass triage:
  - **TD.18** (form-error-association) — 5 forms (BudgetForm,
    ExpenseForm, CategoryManager, CategoryBudgetManager,
    RecurringManager) need `aria-invalid` / `aria-describedby`
    wiring. Consider lifting a small `<FieldError>` component +
    `useFieldError({name})` helper (earns its keep at 5
    consumers).
  - **TD.19** (a11y skip-link) — "Skip to expense list" anchor
    before `<header>`, visible on focus; `id="main-content"` on
    the main list region.
  - **TD.20** (a11y persistent error live region) — replace
    `{error && <p role="alert">…}` with a persistent
    `aria-live="assertive"` slot that's empty when no error.
  - **TD.23** (multi-error consolidation) — App.tsx's cascade
    `error = a || b || c || d || e` hides errors when multiple
    fire; replace with `errors: string[]` collector. Pair with
    TD.20's persistent slot. Could split if scope grows.
- **Cadence:** 600s (impl-iter — sweep work, but concrete).
- **Files to open first for iter-032:**
  - TD.18: 5 forms above + their tests + potentially
    `src/components/FieldError.{tsx,test.tsx,css}` (new).
  - TD.19: `src/App.tsx` (skip-link rendering) + `src/index.css`
    or `src/App.css` (focus-visible styling for the
    `.skip-link`).
  - TD.20 + TD.23: `src/App.tsx` (error fan-in + persistent
    live region).
- **Open questions for iter-032:**
  (1) `<FieldError>` component or just convention? Lean:
      component at 5 consumers; small surface.
  (2) Audit-first (Class A) or spec-and-impl (Class B)? Lean:
      Class B straight, because the audit findings are already
      enumerated. No need for re-discovery.
  (3) Single PR or split into a11y-P1 + multi-error? Lean:
      single PR — all touch error/feedback surfaces, coherent
      sweep.
- **Carry-forward (full):** TD.6 closed; TD.10 (expenseVisibility
  pipeline); TD.12 (refresh-after-mutation isolation); TD.15
  (backupPipeline barrel); TD.17 (App guard test gap); TD.18,
  TD.19, TD.20, TD.23 (iter-032 bundle); TD.21 (CSV core —
  promote when 3rd consumer lands); TD.22 (App split — reassess
  P7→P8); TD.24 (`bindStore` helper — cleanup-bundle); deferred
  `useSpendingByCategory` typing pair-up; DateRangeFilter from>to
  normalize; CSV-injection prefix-escape; filename-vs-exportedAt
  timezone skew; `useFilePicker.ts:38` unreachable fallback;
  `downloadFile.ts:54-58` SSR guard untested.
