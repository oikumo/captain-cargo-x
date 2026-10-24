# src/core — CONTEXT

Controller layer — orchestration only: no `three`, no DOM writes (HUD reacts
to bus events instead; methodology §5). Clocks are injected/seeded, never
wall-clock, so tests drive time deterministically.

| File | Role | Tests |
|---|---|---|
| `loop.ts` | `GameLoop` — frame cadence, clamped dt; deps via `LoopClock` partner (requestFrame / cancelFrame / now, seconds) | `tests/core/loop.test.ts` |
| `bus.ts` | `EventBus<E>` — typed pub/sub; model events → HUD/FX fan-out | `tests/core/bus.test.ts` |
| `input.ts` | `InputMap` — action holds + one-shot edges; DOM key wiring lives in `main.ts` | `tests/core/input.test.ts` |
| `run-controller.ts` | `GameController` — Menu/Playing/Paused/GameOver machine (§9); implements `RunSink` → bus bridge; axes → `run.input` | `tests/core/run-controller.test.ts` |

Planned (methodology §7): `persistence/save.ts` (localStorage gateway).

Up: `../CONTEXT.md` · Down: `../../tests/core/CONTEXT.md`
