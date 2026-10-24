# src — CONTEXT

The port itself. Layer rules are absolute: doc/omt-ts-methodology.md §5
(Game-MVC++); the harness greps the §16 boundaries (imports / IO / DOM /
wall clock / view-DI). Gameplay logic is engine-free — entities publish
state; a view layer renders and polls.

| Path | Layer (§5) | Role | Status |
|---|---|---|---|
| `game/` | model | run orchestration: player, pools, spawner, dome, scoring, lives — no `three` | alive |
| `utils/` | model | pure helpers: time, math, seeded RNG | alive |
| `core/` | controller | orchestration: loop, bus, input map, state machine — no DOM | alive |
| `render/` | view | `GameView`: scene, pooled meshes, chase camera | alive |
| `world/` | view | procedural ocean + sky rig | alive |
| `fx/` | view | bursts, blasts, lock-on beams (pooled) | alive |
| `ui/` | DOM HUD | bus-event overlay (lives/score/screens); no `three` | alive |
| `loaders/` | gateway | glTF registry + procedural placeholders (spec/asset-pipeline.md) | alive |
| `main.ts` | bootstrap | boot glue only: renderer, DOM keys→input, bus wiring, loop start | alive |

`three` permitted only in `main.ts`, `render/`, `world/`, `fx/`, `loaders/`.
A folder lands with its `CONTEXT.md` (AGENTS.md §Navigation, R6).

Up: `../spec/CONTEXT.md` · Down: `game/`, `core/`, `render/`, `ui/`
