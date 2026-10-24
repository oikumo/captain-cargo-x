# tests/core — CONTEXT

Controller-layer tests — injected clocks/partners only (methodology §12).

| File | Covers |
|---|---|
| `loop.test.ts` | `GameLoop`: cadence, clamped deltas, stop/restart, idempotent start |
| `bus.test.ts` | `EventBus`: fan-out payloads, unsubscribe, listener-less emit |
| `input.test.ts` | `InputMap`: hold state, single-shot edges, focus-loss clear |
| `run-controller.test.ts` | `GameController`: menu→playing, pause freeze/thaw, axis routing, gameover→restart, bus relay |

Up: `../CONTEXT.md` · Down: `../../src/core/CONTEXT.md`
