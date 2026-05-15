# Latest

Latest: iter-027 — **P6.B time-series analytics shipped (PR #62).**
New `src/lib/trends.ts` (`summarizeByMonth` + `summarizeYear`); new
`src/lib/year.ts` mirrors `month.ts`; new `<YearSwitcher>` +
`<TrendsChart>` (pure SVG, single accent color via CSS class,
abbreviated x-axis, pluralized tooltip counts). App.tsx adds an
always-visible Trends section; reads from full expenses list so
user filters don't collapse the year view. 587 tests pass (+26).

Stage: S3 (Phase 6, 3 of 5 done) — see `.loop/state.json`
  (`pr_mode: true`, `pr_size_policy: fat`)
Next step: iter-028 — **P6.C accessibility audit pass**. Sweep
  across all components: ARIA roles + labels, keyboard
  navigation, focus management (esp. BackupRestore `<dialog>`),
  screen-reader landmarks, form label association, AA contrast.
  Dispatch a Class A `design-review` sub-agent for the audit
  pass FIRST; Class B impl follows.
Open first (for iter-028): components directory end-to-end.
  High-priority surfaces: `ExpenseForm.tsx`, `ExpenseList.tsx`,
  `CategoryManager.tsx`, `RecurringManager.tsx`,
  `CategoryBudgetManager.tsx`, `BackupRestore.tsx` (focus mgmt),
  filters (`CategoryFilter`, `SearchBox`, `DateRangeFilter`).
  Carry-forward sub-targets to fold in: P3.D chart `<text>`
  aria-hidden; TrendsChart 12-label crowding at <480px;
  empty-state trailing-period normalize; P4.G follow-up.
Open blocks: none open. iter-027 super-reviewer logged with
  APPROVE high-confidence; CR addressed 3 nits (declined
  branded-DateString as out-of-scope).

Test gate: 587 tests pass. `npm run build` 241.62 kB / gzip 72.68
  clean. `npm run lint` clean.
Push: PR #62 squash-merged.

Last-iter shipped (PR #62):
- `src/lib/trends.{ts,test.ts}` — `summarizeByMonth` (ascending,
  no zero-fill) + `summarizeYear` (12-slot fixed grid, throws on
  bad year). 8 trends specs + 7 year specs.
- `src/lib/year.{ts,test.ts}` — currentYear/parseYear/prevYear/
  nextYear/formatYearLabel mirroring month.ts.
- `<YearSwitcher>{tsx,test.tsx,css}` — 4 specs; 44px touch.
- `<TrendsChart>{tsx,test.tsx,css}` — 7 specs; class-only fill.
- App.tsx integration: useMemo over summarizeYear; new
  `app__trends` section; `selectedYear` state independent.
- App.test.tsx: prior P6.E "1 expense" assertion disambiguated
  to `.category-manager__count` collection (more robust than
  first-match).
- logs/blocks.md: iter-027 super-reviewer note added with full
  contract + design-review breakdown.

Operational notes for iter-028:
  - **Cadence:** 600s (impl-iter — concrete sweep work).
  - **Process-fix held**: explicit-path staging on every commit.
    Fourteen-iter streak. Keep it up.
  - `vite.config.ts` `fileParallelism: false` still load-bearing.
  - **localStorage shim centralised** in `src/test/setup.ts`.
  - **Seams in play (unchanged):** `store.ts` (IDB),
    `useStoredCollection` (hook), `errorMessages.ts` (messaging),
    `currency.ts` (formatter). P6.C is a sweep — no new seams.
  - **DB version still 5**, backup `BACKUP_SCHEMA_VERSION`
    still 2 — P6.C is presentation-layer; no schema changes.
  - **TrendsChart CSS pattern note:** `.trends-chart__bar`
    fill comes from CSS, not inline. SpendingChart still inline-
    fills category colors (defensible since color carries
    category-identity meaning). Don't "fix" SpendingChart to
    match unless a P6.C finding specifically calls it out.

Open questions for iter-028:
  (1) Audit-first (Class A) vs spec-and-impl (Class B with
      known list)? Lean: audit-first. Findings will be more
      authoritative and discover things not in carry-forward.
  (2) One big a11y PR or themed PRs? Depends on audit surface;
      lean: 1-2 PRs.
  (3) Should the audit cover the iter-027 TrendsChart mobile-
      label crowding nit? Yes — fold in.
  (4) Anything to defer? Browser-specific a11y issues (Safari
      voiceover etc.) probably out of scope without real device
      testing — flag them but don't ship fixes blindly.
