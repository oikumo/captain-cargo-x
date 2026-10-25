# src/game — CONTEXT

Model layer — pure domain logic, no `three`/DOM/wall clock (methodology
§5); deterministic by seed (RngBox) + injected dt. OpSpec triples (§10)
on public methods; class comments cite the spec rows they implement.

| File | Role | Tests |
|---|---|---|
| `run.ts` | `RunModel` — run lifecycle + pools + sweeps (tracer hits, player contacts, culls), lives/game-over | `tests/game/run.test.ts` |
| `events.ts` | `BoomEvent`/`BoomKind`/`RunSink` — model→controller event vocabulary | (types) |
| `player.ts` | `PlayerShip` — hover-fighter kinematics (yaw/bank/band), cannon, i-frame gate | `tests/game/run.test.ts` |
| `enemy-jet.ts` | `JetPool` — grey jets (SoA ring, straight lines) | `tests/game/run.test.ts` |
| `enemy-drone.ts` | `DronePool` — twin-boom patrols | `tests/game/run.test.ts` |
| `shells.ts` | `ShellPool` — slow dodgeable shells | `tests/game/run.test.ts` |
| `lockon.ts` | `LockonDirector` — gunship event machine (telegraph → shell); `telegraphProgress` is a view-poll getter | `tests/game/run.test.ts` |
| `dome.ts` | `DomeObjective` — shield/dome HP chain + spawn schedule | `tests/game/run.test.ts` |
| `spawner.ts` | `SpawnDirector` — jet flights 3–5 s / drones 6–9 s cadence | `tests/game/run.test.ts` |
| `scoring.ts` | `Scoring` — score + streak chain (×4 cap) | `tests/game/scoring.test.ts` |
| `tracers.ts` | `TracerPool` — player shots (ring, 64 cap) | `tests/game/run.test.ts` |

Up: `../CONTEXT.md` · Down: `../../tests/game/CONTEXT.md`
