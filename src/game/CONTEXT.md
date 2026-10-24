# src/game — CONTEXT

Model layer — the engine-free simulation (methodology §5: imports
`src/utils` only; no three/DOM/wall clock; RNG always seeded). Views poll
these classes; they never render or mutate view state.

| File | Role | Tests |
|---|---|---|
| `events.ts` | `RunSink` + `BoomEvent` vocabulary — controller bridges them to the bus | via run tests |
| `scoring.ts` | `Scoring` — chain surges (1.5 s window, ×4 cap), flats, reset | `tests/game/scoring.test.ts` |
| `player.ts` | `PlayerShip` — auto-forward, steer/bank, climb band, cannon cooldown, i-frames | via run tests |
| `tracers.ts` | `TracerPool` — 64-slot SoA ring, water/timeout expiry | via run tests |
| `enemy-jet.ts` | `JetPool` — grey jets (SoA ring, straight paths) | via run tests |
| `enemy-drone.ts` | `DronePool` — twin-boom drones, low + slow | via run tests |
| `shells.ts` | `ShellPool` — post-telegraph shells, lifetime expiry | via run tests |
| `lockon.ts` | `LockonDirector` — gunship event: telegraph → shell; kill cancels | via run tests |
| `spawner.ts` | `SpawnDirector` — jet flights 3–5 s, drones 6–9 s | via run tests |
| `dome.ts` | `DomeObjective` — 18-hit shield / 10-hit dome lifecycle | via run tests |
| `run.ts` | `RunModel` — orchestrates pools, collisions, scoring, lives, events | `tests/game/run.test.ts` |

Up: `../CONTEXT.md` · Down: `../../tests/game/CONTEXT.md`
