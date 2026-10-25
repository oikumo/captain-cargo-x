# tests — CONTEXT

vitest suite — `npm test` locally, always run by `npm run harness` (R5).
Mirrors `src/` one-to-one by folder. Deterministic only: inject clocks and
partners (methodology §12), never real rAF / timers / wall time.

| Folder | Mirrors | Covers today |
|---|---|---|
| `core/` | `src/core` | `GameLoop` cadence/clamps; `EventBus` pub/sub; `InputMap` holds+edges; `GameController` state machine |
| `game/` | `src/game` | `Scoring` chain rows; `RunModel` flight/spawns/collisions/dome/lives/determinism |
| `loaders/` | `src/loaders` | registry decision layer: 9 keys, zero-`.glb` fallback, per-key placeholder, unknown-key throw |
| `render/` | `src/render` | headless pool-sync smoke: `EntityViews`/`LockonBeams` frames clean, `Booms` pools claim+retire |
| `utils/` | `src/utils` | `clampDelta`, `clamp/lerp/damp`, seeded RNG |

Renderer/presentation stays out of unit scope (doc/omt-ts-methodology.md §11):
`src/ui` is DOM-bound; full frame truth is the browser session checklist.

New `src/<x>/` ⇒ new `tests/<x>/` + a row here, in the same change.
