# iter-025

**Phase:** Phase 6 — PLANNING iter (no code) · **Mode:** thinking-iter
· **pr_mode:** true

## Phase 6 plan

Triaged the iter-022 candidate themes + a long-standing UX gap. Five
P6 items picked; one candidate explicitly declined as out-of-charter.

| # | Item | Scope | Touches |
|---|---|---|---|
| P6.A | Recurring-template CSV export/import | lib + 2 components | `lib/csv.ts` pattern, `RecurringManager`, `useRecurringTemplates` (addMany) |
| P6.B | Time-series analytics (year view + trends) | new lib + new component + filter | new `lib/trends.ts`, new `<TrendsChart>` + `<YearSwitcher>`, App.tsx wiring |
| P6.C | Accessibility audit pass | sweep + fixes | ~20 components: ARIA, kbd nav, focus mgmt, labels, AA |
| P6.D | Performance / bundle pass | measure + code-split + memo | `React.lazy` 3 rare-use surfaces, profiler, summarizeByMonth memo |
| P6.E | Category-deletion cascade UX (TD.6 closes) | hook guard + UI disable | `useCategories.remove`, `<CategoryManager>` |

### Out of scope (declined)

- **Per-expense currency with FX rates** — out-of-charter. App is
  local-only (CLAUDE.md). Adding a network dependency for exchange-
  rate lookups would violate the charter. The P5.E single-pref
  currency is the current ceiling.

## Decisions

- **TD.6 product decision made up-front:** block-while-in-use is the
  pick. Alternatives (silent orphan-to-Uncategorized,
  force-reassign-on-delete) both surprise the user. Block matches the
  app's existing "no destructive surprise" UX (cf. P5.C backup-
  restore confirm-dialog). Documented in P6.E so the impl iter
  doesn't re-litigate.
- **P6.A creates 3rd consumer for TD.13 + TD.14.** The deferred arch-
  pass seams (`makeDownloadBlob`, `useFileRestoreFlow`) were blocked
  on the 3-consumer rule. P6.A flips that — once it lands, the
  Phase-6 → Phase-7 arch pass should pick them up.
- **P6.B introduces a year-view filter pattern.** The budget-coherence
  carveout from P4.B (date-range narrows `visibleExpenses` but NOT
  `monthlyExpenses`) extends naturally: year filter narrows trends
  view, monthly budget still month-scoped. No new carveout shape.
- **Phase 6 cadence target:** ~5 iters, same as Phase 5. P6.A + P6.E
  are obvious fat-iter pair (zero overlap: csv + RecurringManager vs.
  CategoryManager + useCategories). P6.B is single-feature scope.
  P6.C + P6.D are sweep iters that resist fat-iter bundling (P6.C
  reads everything; P6.D measures end-state).

## Sequencing recommendation

1. **iter-026 fat-iter:** P6.A (recurring CSV) + P6.E (category-delete
   cascade). Disjoint file allowlists. Both small. Two PRs.
2. **iter-027:** P6.B (analytics). Single feature; new lib + new
   component. One PR.
3. **iter-028:** P6.C (a11y audit). Sweep iter; dispatch a Class A
   `design-review` agent for the visual gate. May produce 2 PRs.
4. **iter-029:** P6.D (perf/bundle). Measurement first; ship
   improvements with before/after numbers.
5. **iter-030:** Phase 6 → Phase 7 arch pass (mandatory). After it,
   decide whether TD.13 + TD.14 land + plan Phase 7.

## Wake-up handoff

- **Current phase:** Phase 6 (starting). GOALS.md P6.A..P6.E
  populated. P6 backlog is concrete and orderable.
- **Next step:** iter-026 — **fat-iter** shipping **P6.A (recurring
  CSV export/import) + P6.E (category-deletion cascade UX)** in
  parallel. Zero pairwise overlap. Two PRs.
- **Files to open first for iter-026:**
  - P6.A: `src/lib/csv.ts` + `src/lib/csv.test.ts` (mirror the
    pattern); `src/lib/recurring.ts` (RecurringTemplate shape);
    `src/hooks/useRecurringTemplates.ts` (add `addMany`);
    `src/components/RecurringManager.tsx`; new
    `<RecurringExport>` + `<RecurringImport>` (mirror
    `<ExportButton>` + `<ImportButton>`).
  - P6.E: `src/hooks/useCategories.ts` (add in-use check);
    `src/lib/errorMessages.ts` (add `categoryMessages.inUse` if
    not present); `src/components/CategoryManager.tsx` (delete-
    button disable + count); App.tsx (wire `isInUse` predicate if
    we go the predicate route).
- **Cadence:** 600s (impl-iter — two concrete features).
- **Carry-forward (full):** TD.6 promotes to P6.E this iter
  (removing from "carry"); TD.10 (expenseVisibility — still no
  non-React consumer); TD.12 (useStoredCollection refresh-after-
  mutation — preserve until symptom); TD.13 (`makeDownloadBlob` —
  P6.A creates 3rd consumer; revisit at Phase-6→7 arch pass);
  TD.14 (`useFileRestoreFlow` — same); TD.15 (backupPipeline
  barrel); deferred `useSpendingByCategory` typing pair-up; P3.D
  chart text aria-hidden (folds into P6.C); DateRangeFilter from>to
  normalize; CSV-injection prefix-escape (folds into P6.A scope —
  apply to both CSVs); empty-state trailing-period normalize (folds
  into P6.C); P4.G follow-up; Blob-revoke race in
  Export/BackupExport (P6.A may surface this — track); filename-vs-
  exportedAt timezone skew.
- **Open questions for iter-026:**
  (1) `useRecurringTemplates.addMany` — does it follow
      `useExpenses.addMany` shape (returns `{added, skipped, errors}`)?
      Lean yes; consistency.
  (2) Recurring CSV header — `name,amount,description,dayOfMonth,
      categoryId` or include `frequency`? `RecurringTemplate.frequency`
      is currently always `monthly`; can omit until we add others.
  (3) P6.E — predicate-injection vs hook-internal check? Lean:
      hook-internal (the hook already wraps `useStoredCollection`;
      adding a pre-mutation guard fits the pattern).
