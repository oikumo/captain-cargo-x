# src — CONTEXT

The port itself. Layer rules are absolute: `doc/omt-ts-methodology.md` §5
(Game-MVC++); the harness greps the §16 boundaries (imports / IO / DOM / wall
clock / view-DI). Gameplay logic is engine-free — entities publish state, a
view layer renders and polls.

| Path | Layer (§5) | Role | Status |
|---|---|---|---|
| `game/` | model | domain logic: scoring, spawn director, waves, collisions — no `three` | planned |
| `utils/` | model | pure helpers: time, math, seeded RNG | alive |
| `core/` | controller | orchestration: loop → states, input commands, bus, persistence — no DOM | alive |
| `render/` `world/` `fx/` | view | three.js scene assembly; poll game state, never mutate | planned |
| `ui/` | DOM HUD | bus-event overlay (lives/score/menus); no `three` | planned |
| `loaders/` | gateway | glTF registry + placeholder factories (spec/asset-pipeline.md) | planned |
| `main.ts` | bootstrap | only engine-glue at boot: renderer + loop wiring | alive |

`three` permitted only in `main.ts`, `render/`, `world/`, `fx/`, `loaders/`.
A folder lands with its `CONTEXT.md` (AGENTS.md §Navigation, R6); planned
rows gain theirs on first landing.

Up: `../spec/CONTEXT.md` · Down: `core/`, `utils/`
