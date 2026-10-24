# WORK — task ledger (paper harness R1)

Symbols: `[ ]` pending · `[~]` in progress · `[x]` done — done rows carry the
commit ref + the spec they implement. Commit format: `<tag>(<area>): <subject>`
with tag ∈ `feat|fix|refactor|test|docs|art|state`. Budget ≤ 10 KiB (R4).
Exit rule (R5): a task closes `[x]` only with `npm run harness` green; until
the scaffold ships that script, docs-only tasks may close with `n/a` noted.

| Date | Status | Task | Spec | Evidence |
|---|---|---|---|---|
| 2026-10-24 | [x] | Activate the paper layer (T0): seed this ledger, track `.sandbox/CONTEXT.md` entry map, sync spec statuses | `spec/meta-harness.md` | `docs(harness)` (this commit) · harness n/a (docs-only) |
| 2026-10-24 | [ ] | Scaffold the vertical slice: `package.json` + Vite + vitest, `src/main.ts` bootstrap, `scripts/acyx/harness.ts` wired as `npm run harness` (green clean tree + AC2 seeded-violation proof) | `spec/meta-harness.md` §3 | AC2 |
| 2026-10-24 | [ ] | Trim AGENTS.md 7.8 KiB → ≤ 4.0 KiB (sections become nav pointers into `spec/`) — scheduled at the scaffold commit | `spec/meta-harness.md` R4 | accepted-debt note in §2.4 |
