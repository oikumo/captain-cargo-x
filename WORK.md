# WORK — task ledger (paper harness R1)

Symbols: `[ ]` pending · `[~]` in progress · `[x]` done — done rows carry the
commit ref + the spec they implement. Commit format: `<tag>(<area>): <subject>`
with tag ∈ `feat|fix|refactor|test|docs|art|state`. Budget ≤ 10 KiB (R4).
Exit rule (R5): a task closes `[x]` only with `npm run harness` green; done
rows keep a commit ref + spec pointer (both harness-checked, R1).

| Date | Status | Task | Spec | Evidence |
|---|---|---|---|---|
| 2026-10-24 | [x] | Activate the paper layer (T0): seed this ledger, track `.sandbox/CONTEXT.md` entry map, sync spec statuses | `spec/meta-harness.md` | 9a673d0 + c78568b (docs(harness)) · harness n/a (docs-only) |
| 2026-10-24 | [x] | Scaffold the vertical slice: `package.json` + Vite + vitest, `src/main.ts` bootstrap, `scripts/acyx/harness.ts` wired as `npm run harness` (green clean tree + AC2 seeded-violation proof) | `spec/meta-harness.md` §3 | 3e7d140 feat(scaffold) + docs(harness) (this commit) · AC2 proof: 3 seeded violations, each exit 1 with one-line pointer |
| 2026-10-24 | [x] | Trim AGENTS.md 7.8 KiB → ≤ 4.0 KiB (sections became pointers into `doc/GDD.md`/`spec/`) — scheduled at the scaffold commit | `spec/meta-harness.md` R4 | 3e7d140 — AGENTS.md now 2795 B |
| 2026-10-24 | [x] | Nav/context layer (R6): `CONTEXT.md` map in every folder + read-before-enter protocol + root map in AGENTS.md + harness context check | `spec/meta-harness.md` §2 R6 | 7057db4 docs(harness) · green; both R6 failure paths seeded and proven exit 1 |
| 2026-10-24 | [x] | Mechanical enforcement v1.3 (agentx-adapted): R1 ledger lint + src-commit/commit-format audit · R2 spec-status gate (citation-driven) + index sync · R3 TA-deletion guard · git transport: lint (origin-only remotes) + opencode denies (`git commit` always allowed; `git push` denied) | `spec/meta-harness.md` v1.3 | f573775 feat(harness) · AC5 proven: 9 seeded violations (marker/[x]-ref, undeclared src commit, bad subject, draft affiliation, index drift, TA loss, non-origin remote) + deny lane live-blocked `git remote add`, each exit 1 |
| 2026-10-24 | [x] | First gameplay slice — player hover-fighter flight (auto-forward, steer/bank, climb band per GDD §3): extract design → spec rows (draft→agreed), implement with the placeholder-mesh route, harness green | `doc/GDD.md` §3 · `spec/player.md` | 70ba3e1 + 4ef7635 (feat(game)+feat(core)) · 52 vitest green |
| 2026-10-24 | [x] | v0.0.1 threats slice — grey jets + twin-boom drone + lock-on gunship→shell, pooled sim, sphere collisions, spawns per cadence | `spec/enemies.md` | 70ba3e1 + 4ef7635 · tests/game/run.test.ts threats block green |
| 2026-10-24 | [x] | v0.0.1 objective + score slice — shield dome (18 shield / 10 dome hits), chain surges, 6 lives, gameover | `spec/objectives.md` · `spec/scoring.md` | 70ba3e1 + 4ef7635 · dome/scoring/lives blocks green |
| 2026-10-24 | [x] | v0.0.1 view slice — procedural placeholder meshes (zero-`.glb`): ocean/sky world, pooled entity renders, FX bursts/beams, DOM HUD + screens, main boot | `spec/hud.md` · `spec/asset-pipeline.md` | 046462b + f3df919 (feat(render)+test(core)) · dev+build boot, harness green |
| 2026-10-24 | [x] | View-slice rework: integrated SceneView/EntityViews pools + Booms table replacing the 046462b file set (same spec facets; registry decision layer + pool-sync under vitest) | `spec/hud.md` · `spec/asset-pipeline.md` | 51c0760 feat(view) — supersedes 046462b · harness green |

Frame budget (methodology §4, design-phase line): ocean CPU waves 7.7 k verts +
~150 pooled mesh syncs + < 2.2 k sphere distance tests ⇒ ≤ 1.5 ms of the
16.6 ms budget; all pools preallocated, zero hot-path allocation.
