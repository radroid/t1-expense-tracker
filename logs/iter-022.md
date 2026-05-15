# iter-022

**Phase:** Phase 5 — Power-user persistence & data control (FINAL ITER)
· **Mode:** single-feature · **pr_mode:** true

## Feature landed

- **P5.E (PR #56)** — multi-currency, Phase 5 closer. App-wide currency
  preference replaces hard-coded USD. `CurrencyCode = 'USD'|'EUR'|'GBP'
  |'JPY'`, localStorage-backed mirroring `theme.ts`. `useCurrency`
  hook + `<CurrencySelector>` in the header next to `<ThemeToggle>`.
  `formatCurrency(amount, code)` is the new pure formatter (per-code
  cached `Intl.NumberFormat`; JPY gets 0 fraction digits). `currency`
  prop threaded through six money-rendering components via App.tsx.

Final gate: **527 tests pass** (496 → 527, +31), tsc + lint + build
clean (235.07 kB JS / gzip 71.43).

## How it went

- Single Class B sub-agent. Allowlist deliberately wide (~22 files —
  the prop drilling touches every money render). Process-fix held —
  explicit-path staging on every commit. Eleven-iter streak.
- CodeRabbit: 4 trivial findings, all applied (test-description
  rename, setup.ts null-coalescing + global cleanup, currency.test
  defensive try/catch tests).
- Super-reviewer APPROVE high confidence: forbidden-file audit clean
  (no `expense.ts`, `csv.ts`, `backup.ts`, or `src/db/` touched), DB
  v5 + backup schema v2 unchanged.

## Decisions / notes

- **Single-pref v1 (not per-expense)** — per-expense currency without
  conversion rates would mislead totals. v2 can revisit if conversion
  rates land in scope.
- **ISO 4217 allowlist of four** (USD/EUR/GBP/JPY). JPY exercises the
  zero-fraction-digit code path. Extensible by appending to the
  `CURRENCIES` array.
- **Prop drilling vs Context** — chose prop drilling. Depth is
  shallow (App → 6 components). Explicit dependency, no provider
  indirection. Consistent with how `categories` flows down.
- **`formatUSD` shim retained** with `@deprecated` tag. No shipping
  caller; only a pinned test exercises it so a future intentional
  removal is one-PR (move all uses → drop the shim).
- **localStorage shim centralised** in `src/test/setup.ts` — the
  long-standing carry-forward decision was "centralise when 2nd
  consumer lands". `useCurrency` IS that consumer. Per-file
  `beforeAll` shims removed from `theme.test.ts` and
  `ThemeToggle.test.tsx`. Added a global `afterEach(() =>
  localStorage.clear())` so future test files inherit isolation.
- **No DB / backup schema bump** — currency is a UI pref; lives in
  localStorage. Backup snapshots stay at schemaVersion 2 from P5.D.

## Phase 5 closed

All 5 Phase 5 items shipped: P5.A (URL filters), P5.B (JSON backup
export), P5.C (JSON backup restore), P5.D (per-category budgets),
P5.E (multi-currency). **iter-023 MUST run the mandatory
phase-boundary architecture pass** (`improve-codebase-architecture`
skill invocation) before any Phase 6 feature work. Hard rule.

## Wake-up handoff

- **Current phase:** Phase 5 CLOSED.
- **Next step:** iter-023 — **mandatory arch pass** (invoke
  `improve-codebase-architecture` skill as the very first action; log
  result to `logs/blocks.md` with `**Source:** arch-pass`). Per the
  loop protocol, this is a real tool call, not a concept. Output
  drives any pre-Phase-6 refactor and shapes the Phase 6 backlog in
  `GOALS.md` (currently empty — Phase 5 is the last defined phase).
- **Files to open first (for arch-pass context):** `GOALS.md`,
  `logs/iter-017.md` (the previous phase-boundary arch pass — useful
  reference for the pattern + previous candidate list);
  `logs/blocks.md` ## iter-017 — Phase-4 → Phase-5 arch pass section
  (which candidates landed, which were deferred).
- **Candidates already on TD radar:**
  - **TD.9 (`makeStore<T>` factory)** — sequencing constraint cleared
    long ago (3 iters of stability on the TD.7 hook seam). Strong
    candidate for an arch-pass-driven pickup.
  - **TD.10 (`expenseVisibility.ts` pipeline)** — deferred awaiting a
    non-React consumer. Still no consumer; recheck.
  - **TD.11 (drop vestigial `Expense.recurring`)** — DB-cleanup iter
    candidate; arch pass may bundle with TD.9.
  - **TD.12 (`useStoredCollection` refresh-after-mutation error
    isolation)** — preserved pre-iter-018 behavior; arch pass may
    reopen now that the seam is stable.
- **Phase 6 themes (placeholder — arch pass should triage):** the
  app is feature-complete by reasonable measure. Phase 6 candidates
  worth considering: per-expense currency (with conversion-rate
  fetching — would need external dependency); analytics polish
  (trends over time, year view); recurring-template CSV
  export/import; data validation tightening (server-side-style
  schemas — but local-only so light touch); accessibility audit;
  performance pass (Lighthouse run, bundle splitting).
- **Carry-forward (full list):** TD.6 (category-deletion cascade —
  product decision pending); TD.9 / TD.10 / TD.11 / TD.12 above;
  deferred `useSpendingByCategory` typing pair-up; P3.D chart text
  aria-hidden; DateRangeFilter from>to normalize; CSV-injection
  prefix-escape; empty-state trailing-period normalize; P4.G follow-
  up: spinner covers insights; CSV export/import of recurring
  templates; Blob-revoke race in Export/BackupExport;
  filename-vs-exportedAt timezone skew; formatUSD shim removal once
  no consumer (now true).
- **Scheduled:** 1500s (plan-iter — arch pass is a thinking pass).
