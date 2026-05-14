# t1-expense-tracker

A beginner-tier **personal expense tracker** — and the **M1 testbed** for the
`autonomous-build-loop` skill. Deliberately a different shape than the ARK app (no backend,
no framework beyond Vite/React) so the loop is exercised on a simple, local-only project.

## Stack

- Vite + React 19 + TypeScript (strict)
- **IndexedDB** for persistence — no backend, no server, single-user, local-only
- **vitest + @testing-library/react** for tests (jsdom env)
- ESLint (typescript-eslint)

## Commands

| Command | Purpose |
|---|---|
| `npm run dev` | Dev server (user-managed — the loop does NOT start it) |
| `npm run build` | `tsc -b` + `vite build` — the typecheck + build gate |
| `npm test` | `vitest run` — the test gate |
| `npm run typecheck` | `tsc -b --noEmit` |
| `npm run lint` | ESLint |

## Conventions

- TypeScript strict; functional components + hooks; no class components.
- **TDD for all non-visual behaviour** — failing test first (see the loop protocol).
- Keep modules small; one concern per file. Persistence logic lives behind a typed store
  wrapper, never inline in components.
- Visual quality has no automated signal — it routes to a human checkpoint, not a test.

## Autonomous build loop

**The loop protocol is NOT in this file.** It lives in the `autonomous-build-loop` skill.
`.claude/commands/loop.md` triggers one iteration and explicitly invokes that skill — the
skill's `references/per-iteration-checklist.md` is the procedure to follow.

- `.loop/state.json` — machine state (stage, iter, `pr_mode`, `pr_size_policy`). Tier-1 read.
- This repo runs in **`pr_mode: true`** — every feature ships as its own branch + PR + review +
  auto-merge, per the skill's `references/feature-pr-mode.md`. No commit-straight-to-`main`.
- `GOALS.md` is the backlog; `ARCHITECTURE.md` is the domain reference; `logs/` holds iter logs.
- This is a testbed: keep this file minimal. If a loop habit belongs everywhere, it belongs in
  the skill, not here.
