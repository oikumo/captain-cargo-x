# tests — CONTEXT

vitest suite — `npm test` locally, always run by `npm run harness` (R5).
Mirrors `src/` one-to-one by folder. Deterministic only: inject clocks and
partners (methodology §12), never real rAF / timers / wall time.

| Folder | Mirrors | Covers today |
|---|---|---|
| `core/` | `src/core` | `GameLoop` cadence/clamps; `EventBus` pub/sub; `InputMap` holds+edges; `GameController` state machine |
| `game/` | `src/game` | `Scoring` chain rows; `RunModel` flight/spawns/collisions/dome/lives/determinism |
| `utils/` | `src/utils` | `clampDelta`, `clamp/lerp/damp`, seeded RNG |

New `src/<x>/` ⇒ new `tests/<x>/` + a row here, in the same change.
