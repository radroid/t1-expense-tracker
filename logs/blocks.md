# Blocks

Structured log of arch passes, peer reviews, runtime failures, and contract drift.
Append-only. Newest entries at the bottom. The loop never halts on a block — it logs here
and continues.

## iter-001 — Class A integrated peer review

**Source:** peer-review (fat-iter Phase 4, 4 features: P1.A–P1.D)
**Verdict:** APPROVE — all 4 modules plan-compliant, tested (34/34), tsc + lint clean.
**Follow-ups for main agent:**
- App.tsx wiring MUST wrap `createExpense` in try/catch — form emits raw `ExpenseInput`
  (amount may be 0/negative); `createExpense` throws on those. Surface error, don't crash.
- Mixed semicolon style across iter-001 files (P1.A/P1.D use them, P1.B/P1.C don't).
  Cosmetic, lint passes. → carry-forward: pick a convention before it spreads.

## iter-001 — CodeRabbit review hung

**Source:** runtime failure (feature-pr-mode step 7, PR #1)
`coderabbit review --plain` ran 26+ min with zero output on the P1.A branch — hung,
not progressing. Killed it. Routed around per continuous-loop: used the Class A
integrated peer review (APPROVE, all 4 features) as the merge gate — `feature-pr-mode`
allows a Class A sub-agent as the M1 super-reviewer floor.
→ resolved: re-ran scoped (`--type committed --base main`) — completed in ~2 min.
  Root cause: unscoped `--plain` was reviewing all uncommitted P1.B/C/D files too.
  Fix for next iter: always scope CodeRabbit with `--type committed --base main`.

## iter-001 — CodeRabbit review, PR #1 (P1.A)

**Source:** code-review (feature-pr-mode step 7)
1 finding — trivial nitpick: optional JSDoc on `createExpense`. Declined via
receiving-code-review: project CLAUDE.md defaults to no comments; function is small
with full type coverage; CodeRabbit marked it trivial/optional. No blocking issues.


