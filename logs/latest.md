# Latest

Latest: iter-005 — refactor iter: TD.3 shipped (PR #14) — `AddExpenseForm` +
`EditExpenseForm` collapsed into one `ExpenseForm`. Sets up P2.C.

Stage: S3 (feature dev) — see `.loop/state.json` (`pr_mode: true`, `pr_size_policy: fat`)
Next step: iter-006 — Phase 2 continues. **P2.C + P2.F is a clean fat-iter pair**
  (disjoint files): P2.C = category `<select>` in `ExpenseForm` + thread `categoryId`
  through `createExpense`/`applyExpenseEdit` (fold in TD.2 — `applyExpenseEdit` currently
  drops optional fields) + App; P2.F = new `categoryTotals` lib + `SpendingByCategory`
  component. P2.D + P2.E both touch `ExpenseList` — sequence them in a later iter.
Open first: `GOALS.md`, `src/components/ExpenseForm.tsx`, `src/lib/expense.ts`,
  `src/lib/totals.ts`, `src/App.tsx`.
Open blocks: none open — see `logs/blocks.md` for iter-005 peer-review entry.
Carry-forward: TD.1 (formatCurrency), TD.2 (fold into P2.C), TD.4 (useExpenses/
  useCategories hooks), TD.5 (DB-migration test).
Test gate: 107 tests pass; `npm run build` + `npm run lint` clean.
Push: n/a — pr_mode, all work merged via PRs.
⚠️ Token runway: 5 full in-session iters done — STRONGLY recommend a fresh Claude Code
  session before iter-006. The loop resumes from the next scheduled wake-up after relaunch.

Last-iter shipped:
- TD.3: one `ExpenseForm` ({ initial?, submitLabel, onSubmit, onCancel?, clearOnSubmit? })
  replacing the two form components; App re-wired with a `key` per mode to force remount.
