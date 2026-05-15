# Latest

Latest: iter-012 — Phase 3 → 4 arch pass. `useVisibleExpenses` hook extracted
(PR #34). Filter pipeline now lives behind one seam; P4.A search and P4.B
date-range will plug into its signature rather than scattering through App.

Stage: S3 (feature dev) — see `.loop/state.json` (`pr_mode: true`, `pr_size_policy: fat`)
Next step: iter-013 — **Phase 4 begins.** Fat-iter candidates: **P4.A**
  (search across expense descriptions), **P4.B** (date-range filter),
  **P4.F** (dark mode + localStorage). P4.A + P4.B both extend
  `useVisibleExpenses` with new view-state params; P4.F is fully orthogonal
  (theme toggle, CSS custom properties, localStorage adapter).
Open first: `GOALS.md` (Phase 4 backlog), `src/hooks/useVisibleExpenses.ts`
  (the seam being extended), `src/App.tsx`, `src/index.css` (where dark-mode
  CSS variables would live), `src/lib/expenseFilter.ts`.
Open blocks: none open — see `logs/blocks.md` for the iter-012 arch-pass
  entry + the deferred `useSpendingByCategory` (pair with P4.G).
Carry-forward: TD.6 (category-deletion cascade — pending product decision);
  deferred `useSpendingByCategory` extraction (trigger: P4.G empty-state
  polish); P3.D chart `<text>` aria-hidden follow-up (low priority).
Test gate: 243 tests pass; `npm run build` + `npm run lint` clean.
Push: n/a — pr_mode, all work merged via PRs.

Last-iter shipped:
- Arch-pass PR #34: `useVisibleExpenses` hook — composes byMonth → byCategory
  filters into one seam. App.tsx loses two inline filter calls.

Declined / deferred from arch pass:
- Data-hook factory across the 3 data hooks — declined (each hook's
  validation + error + load path is unique; factory would push divergence
  into config objects without removing it).
- `useSpendingByCategory` dedup — deferred to P4.G (empty-state polish)
  so the interface is shaped by real requirements.

Open questions for iter-013 (note in plan):
  (1) P4.B date-range UI — two `<input type="date">` pickers below the
      MonthSwitcher? Lean own component below the switcher.
  (2) P4.B vs MonthSwitcher interplay — if user picks a date range spanning
      multiple months, dim MonthSwitcher OR auto-clear the range when month
      is switched. Decide in plan.
  (3) P4.F localStorage key — `expense-tracker:theme`? Lean yes.

Operational notes for iter-013:
  - Process-fix held this iter (stage-by-explicit-path) — no `-A` mishap.
  - `vite.config.ts` `fileParallelism: false` still load-bearing — keep.
