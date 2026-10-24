# src/core — CONTEXT

Controller layer — orchestration only: no `three`, no DOM writes (HUD reacts
to bus events instead; methodology §5). Clocks are injected/seeded, never
wall-clock, so tests drive time deterministically.

| File | Role |
|---|---|
| `loop.ts` | `GameLoop` — frame cadence, clamped dt; deps via `LoopClock` partner (requestFrame / cancelFrame / now, seconds) · tests: `tests/core/loop.test.ts` |

Planned (methodology §8/§9/§7): `commands/` (input intents), state machine
triads, `persistence/save.ts` (localStorage gateway). Each lands with its own
row here + `CONTEXT.md` for new subfolders.
