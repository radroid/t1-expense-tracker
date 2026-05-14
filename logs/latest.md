# Latest

Latest: iter-001 — Phase 1 foundation: P1.A–P1.D shipped (4 PRs merged). App is
functional — add an expense, it persists to IndexedDB and renders newest-first.

Stage: S3 (feature dev) — see `.loop/state.json` (`pr_mode: true`, `pr_size_policy: fat`)
Next step: iter-002 — pick P1.E (delete), P1.F (edit), P1.G (running total). E + F both
  touch the expense-row UI + App.tsx — sequence E→F or extract a shared row component;
  G (header sum) is independent.
Open first: `GOALS.md`, `src/App.tsx`, `src/components/ExpenseList.tsx`,
  `src/db/expenseStore.ts`, `src/lib/expense.ts`.
Open blocks: none open — see `logs/blocks.md` for iter-001 review history.
Carry-forward: (1) pick a semicolon convention (lean semicolon-free per Vite scaffold);
  (2) always scope CodeRabbit: `coderabbit review --plain --type committed --base main`.
Test gate: 39 tests pass; `npm run build` + `npm run lint` clean.
Push: n/a — pr_mode, all work merged via PRs #1–#4.

Last-iter shipped:
- P1.A Expense model + createExpense factory; P1.B IndexedDB store wrapper;
  P1.C AddExpenseForm + App wiring (load/add/validate/error); P1.D ExpenseList component.
- App gained a minimal `loading` state (start on P4.G).
