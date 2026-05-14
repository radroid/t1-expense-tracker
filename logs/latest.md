# Latest

Latest: iter-000 (bootstrap) — testbed scaffolded; bare-bones app runs, no features built yet.

Stage: S3 (feature dev) — see `.loop/state.json` (`pr_mode: true`, `pr_size_policy: fat`)
Next step: iter-001 — pick 3–4 independent features from `GOALS.md` Phase 1 (e.g. P1.A model,
  P1.B store, P1.C add-form, P1.D list — check pairwise file independence before bundling).
Open first: `GOALS.md`, `ARCHITECTURE.md`, `src/App.tsx`, `src/` (currently bare-bones shell).
Open blocks: none
Carry-forward: none
Test gate: `npm run build` clean; `npm test` — 1 smoke test (`src/App.test.tsx`) passing.
Push: n/a — iter-000 is the bootstrap commit.

Last-iter shipped:
- Vite + React 19 + TS scaffold; vitest + RTL wired; bare-bones Expense Tracker shell.
- Loop files: CLAUDE.md (minimal), ARCHITECTURE.md, GOALS.md (27 items / 4 phases),
  .claude/commands/loop.md (explicit Skill invocation), .loop/state.json, logs/.
