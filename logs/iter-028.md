# iter-028

**Phase:** Phase 6 (in progress) · **Mode:** audit-first sweep
· **pr_mode:** true

## Features landed (PR #63)

- **P6.C** — Accessibility audit pass. Class A audit enumerated
  13 P0 + 8 P1 + 8 P2 findings across 27 components + App.tsx;
  Class B sub-agent shipped the P0 cluster (14 fixes):
  - **Copy / consistency:** empty-state titles drop trailing
    periods (a11y-001); BackupRestore pluralization for 5 counts
    (a11y-011).
  - **SR semantics:** chart `<text>` aria-hidden (a11y-002);
    section `aria-labelledby` landmarks (a11y-003); BudgetVsActual
    `role="progressbar"` + aria-value* (a11y-005); BackupRestore
    `<dialog>` aria-labelledby + onClose cleanup (a11y-006);
    arrow/× glyphs wrapped aria-hidden (a11y-008, a11y-015);
    ImportButton/RecurringImport `<p>` → `<div role="status">`
    HTML-validity fix (a11y-028); ImportButton headerError
    `role="alert"` parity (a11y-029).
  - **Keyboard:** `:focus-within` outline on file-input labels
    (a11y-009).
  - **Loading UX:** all 6 bottom sections moved inside
    `!loading` branch — no more empty zero-state flash before
    data resolves (a11y-012).
  - **Mobile + motion:** TrendsChart hides odd month labels at
    ≤480px, alt labels stay in per-bar aria-label (a11y-013);
    global `prefers-reduced-motion` rule in index.css (a11y-021).

Final gate: **588 tests pass** (587 → 588, +1 progressbar regression
test). Build 242.80 kB / gzip 72.92 kB clean. Lint clean.

## How it went

- Audit-first pattern worked well: Class A read-only sub-agent
  surfaced 13 P0 + 8 P1 + 8 P2 findings, each with a concrete fix
  line. Class B then implemented from that list.
- 14 P0 implementations + 1 new regression test + 8 test
  assertions updated for the period-drop copy changes + 1 App test
  rescoped (Rent assertion got ambiguous after a11y-012's
  reordering — narrowed to `.expense-list` scope).
- Super-reviewer: APPROVE-WITH-NITS high-confidence. Two minor
  nits captured as future TD candidates (clamp aria-valuenow
  lower bound defensively; idiomatic RTL within() vs
  querySelector).
- CodeRabbit: zero inline findings.
- Process-fix held: explicit-path staging on every commit.
  Fifteen-iter streak.

## Decisions / notes

- **P1 form-error-association cluster deferred to TD.18.** Five
  forms (BudgetForm, ExpenseForm, CategoryManager,
  CategoryBudgetManager, RecurringManager) need
  `aria-invalid`/`aria-describedby` wiring — modest per-form
  delta but a coherent independent sweep.
- **Skip-link (a11y-004) and persistent error live region
  (a11y-007) deferred** as TD.19 + TD.20 — feature-shaped work
  outside this polish sweep.
- **`pluralize` helper inlined** in BackupRestore (no other
  consumer; lifting earns its keep at 2nd consumer per the
  established pattern).

## Wake-up handoff

- **Current phase:** Phase 6, 4 of 5 items done. iter-029 picks
  up **P6.D performance / bundle pass**.
- **Next step:** iter-029 — Lighthouse-guided perf measurement +
  code-split. Targets: (a) measure current bundle (242.80 kB /
  gzip 72.92 kB); (b) code-split rare-use surfaces
  (`RecurringManager`, `CategoryManager`, `BackupRestore`) via
  `React.lazy` + `<Suspense>`; (c) audit re-render hotspots via
  React DevTools profiler (or by reading the component tree);
  (d) memoize expensive aggregations (`summarizeByMonth`,
  `summarizeYear`, `spendingByCategory`); (e) defer non-critical
  CSS if Lighthouse flags it.
- **Cadence:** 600s (impl-iter — measurement + concrete code-split
  work).
- **Files to open first for iter-029:**
  `src/App.tsx` (where to inject Suspense + lazy boundaries);
  `package.json` (verify Vite config); `vite.config.ts` (may
  need manual-chunks adjustment); `src/components/RecurringManager.tsx`,
  `CategoryManager.tsx`, `BackupRestore.tsx` (rare-use targets);
  `src/lib/trends.ts`, `src/lib/categoryTotals.ts` (memo
  candidates).
- **Open questions for iter-029:**
  (1) Lighthouse measurement: run via Chrome DevTools (would
      need the user to grab it locally) or estimate from bundle
      analysis + manual reasoning? Lean: bundle analysis + manual
      reasoning since the loop can't run a browser session
      reliably.
  (2) Code-split depth: lazy-load all three rare surfaces in one
      Suspense boundary, or per-component? Lean: per-component
      with shared fallback spinner.
  (3) Are React 19's automatic optimizations enough that explicit
      `React.memo` is overkill? Lean: skip memo unless profiler
      shows a hotspot. React 19 compiler isn't enabled here.
- **Carry-forward (full):** TD.6 closed; TD.10 (expenseVisibility);
  TD.12 (refresh-after-mutation isolation); TD.13 + TD.14
  (3rd-consumer met — defer to Phase-6→7 arch pass); TD.15
  (backupPipeline barrel); TD.17 (App guard test gap); **TD.18
  (NEW — form-error-association sweep, iter-028 a11y P1 cluster)**;
  **TD.19 (NEW — a11y skip-link)**; **TD.20 (NEW — a11y
  persistent error live region)**; deferred
  `useSpendingByCategory` typing pair-up; DateRangeFilter from>to
  normalize; CSV-injection prefix-escape (now both CSVs);
  Blob-revoke race in Export/BackupExport/RecurringExport
  (3 consumers now); filename-vs-exportedAt timezone skew.
