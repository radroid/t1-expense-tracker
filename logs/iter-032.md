# iter-032

**Phase:** Pre-Phase-7 (a11y-P1 sweep) · **Mode:** fat-iter
(4 features, 1 PR) · **pr_mode:** true

## Features landed (PR #68)

- **TD.18** — A11y form-error-association sweep across 5 forms
  (BudgetForm, ExpenseForm, CategoryManager, CategoryBudgetManager,
  RecurringManager). Each form now tracks an `errorField`
  discriminator alongside its error string; the failing `<input>`
  gets `aria-invalid={errorField === '<name>'}` +
  `aria-describedby="<form>-error"`. New `<FieldError>` component
  (`src/components/FieldError.{tsx,test.tsx,css}`) renders a
  persistent slot with `aria-live="polite"` and toggles
  `role="alert"` when the message becomes non-empty.
  CategoryManager Rename now reverts to canonical name on empty
  submit (caught by the audit).
- **TD.19** — Skip-link. `<a className="skip-link"
  href="#main-content">Skip to expense list</a>` is the first
  child of `<main>`; `transform: translateY(-200%)` at rest,
  `:focus` reveals with focus-visible styling. New `<section
  id="main-content" aria-label="Expense list">` wraps ExpenseList.
- **TD.20** — Persistent error live region. App.tsx now renders
  `<div role="alert" aria-live="assertive" aria-atomic="true"
  className="app__error">` ALWAYS in the DOM (empty string when no
  errors). Replaces the prior `{error && <p>…}` conditional that
  birthed a fresh live region each time.
- **TD.23** — Multi-hook error consolidation. The old
  `error = a || b || c || d || e` cascade is replaced with an
  `errors: string[]` collector that filters falsy and joins with
  " · ". Multiple simultaneous hook errors no longer mask each
  other.

Final gate: **628 tests pass** (606 → 628, +22). Main JS 233.07
kB / gzip 71.94 kB (+0.96/0.33 from baseline; FieldError +
errorField wiring). Lint clean. Lazy chunks unchanged.

## How it went

- Single Class B sub-agent owned the full a11y-P1 surface — 5
  forms + new FieldError + App.tsx integration. Fat-iter via one
  agent (not parallel) because all four TDs share the error/
  feedback surface; splitting would have produced 4 conflicting
  diffs over App.tsx alone.
- TDD discipline: failing test first for every form's a11y wiring;
  new FieldError component shipped with 5 unit specs covering
  the persistent-slot semantics.
- Super-reviewer APPROVE-WITH-NITS, high confidence. Two minor
  non-blocking nits captured in blocks.md.
- CodeRabbit: pass clean, zero inline findings.
- Process-fix held: explicit-path staging on every commit.
  Eighteen-iter streak.

## Decisions / notes

- **`<FieldError>` shipped as a component** (lean from iter-031
  handoff confirmed). 5 consumers earns its keep — locality of the
  `aria-live`/`role="alert"` toggle behavior beats per-form
  inlining. Single test file covers the persistent-slot contract.
- **`errorField` discriminator over per-field error map** — each
  form has at most ONE error at a time (the validation cascade
  bails on the first failure). A `{field: string} | null`
  discriminator is honest about that shape; a `Record<string,
  string>` would have implied multi-field errors that don't exist.
- **CategoryManager Rename revert-on-empty** was caught during
  TD.18 audit. Empty rename was previously a silent no-op that
  left the input in a dirty empty state; now reverts to the
  canonical name so the row stays self-consistent.
- **Persistent live region is `aria-live="assertive"`** (not
  `polite`) — App-level errors are interruptive by nature (save
  failed, restore failed). FieldError stays `aria-live="polite"`
  because per-field validation should not interrupt the user
  mid-typing.

## Wake-up handoff

- **Current phase:** Pre-Phase-7 polish complete. iter-033 is the
  Phase 7 PLANNING iter.
- **Next step:** iter-033 — **Phase 7 PLANNING**. Triage the 5
  themes (recurring-template EDIT, undo stack, bank-CSV presets,
  local categorization heuristics, calendar-view tab) into
  concrete `P7.A`...`P7.E` items in `GOALS.md`. Pick 2–3 feature
  items based on user value × independence. No code this iter —
  pure planning.
- **Cadence:** 1500s (plan-iter — thinking work).
- **Files to open first for iter-033:**
  - `GOALS.md` — write concrete P7.A..P7.E items
  - `ARCHITECTURE.md` — verify the seams Phase 7 features will
    need (recurring EDIT needs `useStoredCollection.update`;
    bank-CSV presets need `tokenizeCsv` core; calendar-view
    needs `month.ts` + visibility pipeline).
- **Open questions for iter-033:**
  (1) Recurring-template EDIT vs add+remove only — the
      ExpenseForm pattern (TD.3) consolidation gives us a
      template; cheapest of the 5 themes. Lean: include.
  (2) Undo stack scope — single-step undo (last mutation) or
      multi-step? Lean: single-step (simpler invariants;
      `useStoredCollection` already has the mutation channel).
  (3) Bank-CSV presets — would unlock TD.21 (CSV core). Pick if
      we want the 3rd consumer to land naturally.
  (4) Local categorization heuristics — pure-function lib + UI
      toggle. Could ship as 1 iter. Lean: include.
  (5) Calendar-view tab — concentrates date-axis logic;
      visually compelling but cosmetic. Lean: defer to P8.
- **Carry-forward (full):** TD.10 (expenseVisibility pipeline);
  TD.12 (refresh-after-mutation isolation); TD.15
  (backupPipeline barrel); TD.17 (App guard test gap); TD.21
  (CSV core — promote when 3rd consumer lands); TD.22 (App
  split — reassess P7→P8); TD.24 (`bindStore` helper —
  cleanup-bundle); deferred `useSpendingByCategory` typing
  pair-up; DateRangeFilter from>to normalize; CSV-injection
  prefix-escape; filename-vs-exportedAt timezone skew;
  `useFilePicker.ts:38` unreachable fallback;
  `downloadFile.ts:54-58` SSR guard untested. **NEW from
  iter-032 super-reviewer:** two FieldError/App.tsx nits
  captured in blocks.md.
