# src/utils — CONTEXT

Model-layer pure helpers: no `three`, no DOM, no wall clock. Functions carry
OpSpec-style Pre/Post TSDoc (methodology §10).

| File | Role | Tests |
|---|---|---|
| `time.ts` | `clampDelta(dt, max)` — frame-spike and rewind clamp for the loop | `tests/utils/time.test.ts` |

Minimal scaffold — grows with model needs; seeded RNG + math helpers next.
