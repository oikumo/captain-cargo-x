# src/utils — CONTEXT

Model-layer pure helpers: no `three`, no DOM, no wall clock. Functions carry
OpSpec-style Pre/Post TSDoc (methodology §10).

| File | Role | Tests |
|---|---|---|
| `time.ts` | `clampDelta(dt, max)` — frame-spike and rewind clamp for the loop | `tests/utils/time.test.ts` |
| `math.ts` | `clamp` / `lerp` / `damp` — bounds, interpolation, exp smoothing | `tests/utils/math.test.ts` |
| `random.ts` | `makeRng` (mulberry32), `range`, `RngBox` — seeded gameplay rolls, reseedable per run | `tests/utils/random.test.ts` |

Up: `../CONTEXT.md` · Down: `../../tests/utils/CONTEXT.md`
