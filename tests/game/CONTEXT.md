# tests/game — CONTEXT

Integration suite for the model layer: deterministic drives via injected
clock + seeded RNG (methodology §11/§12 — never wall time).

| File | Covers |
|---|---|
| `scoring.test.ts` | `Scoring`: streak chain, ×4 cap, window expiry, flats, reset |
| `run.test.ts` | `RunModel`: flight/climb/cannon, spawns+cadence, rams + i-frames, shells, lock-on cancel, dome chain, lives/gameover, determinism |

Up: `../CONTEXT.md` · Down: `../../src/game/CONTEXT.md`
