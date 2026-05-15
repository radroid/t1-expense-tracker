# Latest

Latest: iter-032 — **a11y-P1 fat-iter shipped (PR #68).**
Four sibling a11y refactors landed in one coherent sweep across
the error/feedback surface. TD.18 (form-error-association across
5 forms via new `<FieldError>` + `errorField` discriminator);
TD.19 (skip-link as first child of `<main>`); TD.20 (persistent
live region always in DOM); TD.23 (multi-error consolidation —
errors collector replaces `||` cascade). 628 tests pass (+22).
Main bundle 233.07 kB / gzip 71.94.

Stage: S3 (pre-Phase-7 refactors complete) — see
  `.loop/state.json` (`pr_mode: true`, `pr_size_policy: fat`)
Next step: iter-033 — **Phase 7 PLANNING**. Triage the 5 themes
  (recurring-template EDIT, undo stack, bank-CSV presets, local
  categorization heuristics, calendar-view tab) into concrete
  `P7.A`...`P7.E` items in GOALS.md. Pick 2–3 feature items
  based on user value × independence. NO code this iter — pure
  planning.
Open first (for iter-033):
  - `GOALS.md` — append `## Phase 7 — <title>` with concrete
    `P7.A`...`P7.E` items; promote whichever themes earn their
    keep.
  - `ARCHITECTURE.md` — verify the seams the chosen themes
    will need (`useStoredCollection.update` for recurring EDIT;
    `tokenizeCsv` for bank-CSV presets; `month.ts` for
    calendar-view).
  - `logs/iter-032.md` — open questions (1)..(5) above are the
    triage spine.
Open blocks: none. iter-032 super-reviewer logged under
  `## iter-032 — super-reviewer (a11y-P1 bundle: TD.18 +
  TD.19 + TD.20 + TD.23)` with APPROVE-WITH-NITS high-
  confidence. Two minor nits captured for carry-forward.

Test gate: 628 tests pass. `npm run build` main JS 233.07 kB /
  gzip 71.94 kB. Lint clean.
Push: PR #68 squash-merged.

Last-iter shipped (PR #68):
- `src/components/FieldError.{tsx,test.tsx,css}` (new; 5 specs)
  — persistent slot, `aria-live="polite"`, toggles
  `role="alert"` when message non-empty. min-height reserves
  layout to prevent jump.
- 5 forms gained `errorField` discriminator + per-input
  `aria-invalid` + `aria-describedby="<form>-error"`:
  BudgetForm, ExpenseForm, CategoryManager,
  CategoryBudgetManager, RecurringManager. CategoryManager
  Rename reverts to canonical name on empty submit.
- `src/App.tsx` — skip-link added as first child of `<main>`;
  new `<section id="main-content" aria-label="Expense list">`
  wraps ExpenseList; `errors: string[]` collector replaces
  `error = a || b || c || ...` cascade; persistent
  `<div role="alert" aria-live="assertive" aria-atomic="true">`
  always rendered.
- `src/App.css` — `.skip-link` with `transform:
  translateY(-200%)` at rest, `:focus` reveals.
- 628 tests pass (+22). Main 233.07/71.94. Lint clean.

Operational notes for iter-033:
  - **Cadence:** 1500s (plan-iter — thinking work, not impl).
  - **Process-fix held**: explicit-path staging on every commit.
    Eighteen-iter streak.
  - `vite.config.ts` `fileParallelism: false` still
    load-bearing.
  - **localStorage shim centralised** in `src/test/setup.ts`.
  - **Seams in play (post-iter-032):** `store.ts` (IDB),
    `useStoredCollection` (hook), `errorMessages.ts`
    (messaging), `currency.ts` (formatter), `downloadFile.ts`
    (download), `useFilePicker.ts` + `useParsedFileImporter.ts`
    (import), `FieldError.tsx` (a11y error slot).
  - **DB version still 5**, backup `BACKUP_SCHEMA_VERSION`
    still 2. iter-033 is pure planning — no schema changes.
  - **Phase 7 themes from iter-030 arch pass:** 5 candidates
    listed in GOALS.md `## Phase 7 — TBD` section. Triage
    them into concrete P7.A..P7.E this iter.

Open questions for iter-033:
  (1) How many P7 items? Lean: 3 feature + maybe-bundle
      polish. 5 is too many; 2 risks under-scoping the phase.
  (2) Recurring EDIT — include? Lean: yes (cheapest, reuses
      ExpenseForm consolidation pattern).
  (3) Bank-CSV presets — include? Lean: yes (concrete user
      value, unlocks TD.21 promotion).
  (4) Calendar-view — include? Lean: defer to P8 (visually
      compelling but cosmetic; less locality leverage).
  (5) Undo stack — include? Lean: yes (touches the
      mutation channel, validates `useStoredCollection`).
