---
description: Run one iteration of the autonomous build loop for t1-expense-tracker
---

Run **ONE** iteration of the autonomous build loop.

## Step 0 — load the protocol (do this first, every time)

Invoke the `Skill` tool with `skill: "autonomous-build-loop"`. **That skill IS the protocol** —
its `references/per-iteration-checklist.md` is the procedure to follow. Do not improvise the loop
from this file; this file is only the trigger. This is the whole point of the testbed: the skill,
not a copied-out protocol, drives the loop.

## Then follow the checklist

1. Read Tier-1 state: `CLAUDE.md`, `.loop/state.json`, `logs/latest.md`, `GOALS.md`.
2. Pick 3–4 independent features from `GOALS.md` (zero pairwise file overlap) — fat-iter mode.
3. Execute: **TDD for all non-visual behaviour** (failing test first). Vertical slices —
   `src/db/` + `src/lib/` + `src/components/` + tests.
4. Verify: `npm test`, `npm run build` (typecheck), `npm run lint` — evidence, not "should pass".
5. Close out: `.loop/state.json` has **`pr_mode: true`**, so each feature ships via
   `references/feature-pr-mode.md` — branch + `gh pr create` + CodeRabbit + super-reviewer +
   auto-merge on APPROVE+green. No commit straight to `main`.
6. Update `GOALS.md` markers, write `logs/iter-NNN.md`, update `logs/latest.md`, bump
   `.loop/state.json` `iter`.
7. End the turn — schedule the next iter (in-session) per the checklist. No semantic halt.

$ARGUMENTS
