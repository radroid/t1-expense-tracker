# Latest

Latest: iter-028 — **P6.C accessibility audit pass shipped (PR #63).**
Class A audit enumerated 13 P0 + 8 P1 + 8 P2 findings; Class B
sub-agent shipped the **14 P0 fixes**. P1 form-error-association
cluster deferred as TD.18; skip-link (TD.19) + persistent error
live region (TD.20) deferred as feature-shaped follow-ups. 588
tests pass.

Stage: S3 (Phase 6, 4 of 5 done) — see `.loop/state.json`
  (`pr_mode: true`, `pr_size_policy: fat`)
Next step: iter-029 — **P6.D performance / bundle pass**.
  Lighthouse-guided measurement + `React.lazy` code-split on
  rare-use surfaces (RecurringManager, CategoryManager,
  BackupRestore). Memoize summarizeByMonth/summarizeYear/
  spendingByCategory if profiler flags them. Bundle measurement
  via manual analysis (loop can't drive a browser session).
Open first (for iter-029): `src/App.tsx` (Suspense + lazy
  boundaries); `vite.config.ts` (manual-chunks if useful);
  `src/components/RecurringManager.tsx`, `CategoryManager.tsx`,
  `BackupRestore.tsx` (rare-use targets); `src/lib/trends.ts`,
  `src/lib/categoryTotals.ts` (memo candidates).
Open blocks: none. iter-028 audit + super-reviewer logged under
  `## iter-028 — audit + super-reviewer (P6.C a11y sweep)` with
  APPROVE-WITH-NITS high-confidence. Two nits captured for TD.

Test gate: 588 tests pass. `npm run build` 242.80 kB / gzip
  72.92 clean. `npm run lint` clean.
Push: PR #63 squash-merged.

Last-iter shipped (PR #63): 14 P0 a11y fixes —
  - Copy: empty-state titles drop trailing periods;
    BackupRestore pluralization.
  - SR semantics: chart `<text>` aria-hidden; section landmarks
    with aria-labelledby; BudgetVsActual progressbar role;
    BackupRestore dialog aria-labelledby + onClose cleanup;
    arrow/× glyphs aria-hidden; ImportButton/RecurringImport
    `<p>` → `<div>` HTML validity fix; ImportButton headerError
    role="alert" parity.
  - Keyboard: file-input label :focus-within outline.
  - Loading UX: all 6 bottom sections moved inside !loading
    branch (no more empty zero-state flash).
  - Mobile + motion: TrendsChart hides odd labels at ≤480px;
    global prefers-reduced-motion rule.
  - Tests: +1 progressbar regression; 8 test assertion updates
    for the copy changes; 1 Rent test rescoped to `.expense-list`
    after section reordering.

Operational notes for iter-029:
  - **Cadence:** 600s (impl-iter).
  - **Process-fix held**: explicit-path staging on every commit.
    Fifteen-iter streak. Keep it up.
  - `vite.config.ts` `fileParallelism: false` still load-bearing.
  - **localStorage shim centralised** in `src/test/setup.ts`.
  - **Seams in play (unchanged):** `store.ts` (IDB),
    `useStoredCollection` (hook), `errorMessages.ts` (messaging),
    `currency.ts` (formatter). P6.D may introduce a Suspense
    boundary as a new presentation seam but won't replace any
    existing one.
  - **DB version still 5**, backup `BACKUP_SCHEMA_VERSION`
    still 2 — P6.D is presentation-layer; no schema changes.
  - **Loading-state structure note:** after a11y-012, all bottom
    sections render only inside `!loading`. Any code-split
    Suspense boundary should sit inside that branch (not wrap
    it) so the loading skeleton doesn't double-render.

Open questions for iter-029:
  (1) Run Lighthouse via Chrome DevTools (needs user-driven
      browser session) or estimate from bundle stats + manual
      reasoning? Lean: manual reasoning. Document the trade-off.
  (2) Code-split granularity: per-component lazy() or grouped
      under one Suspense fallback? Lean: per-component,
      shared fallback spinner.
  (3) `React.memo` on hot leaf components, or skip? Lean: skip
      unless profiler flags a real hotspot. React 19 compiler
      not enabled here.
  (4) Bundle target — set an explicit kB cap, or just ship
      what the splits produce? Lean: no cap; report before/after
      numbers and let those speak.
