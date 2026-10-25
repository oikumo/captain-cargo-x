# tests/game — CONTEXT

Vitest mirrors of `src/game` — deterministic (seeded RNG, injected dt);
no three/DOM. See `../CONTEXT.md` for the mock-partner rules.

| File | Covers |
|---|---|
| `run.test.ts` | `RunModel`: flight, spawning cadence, tracer hits, dome chain (18/10), lock-on → shell, lives/game-over, determinism/culls |
| `scoring.test.ts` | `Scoring`: streak chain (×4 cap), shield-hit and flat rows, reset |

Up: `../CONTEXT.md` · Down: `../../src/game/CONTEXT.md`
