# tests/core — CONTEXT

`src/core` controller tests — deterministic; `LoopClock` partner mocked in
process, no rAF, no wall time.

| File | Covers |
|---|---|
| `loop.test.ts` | `GameLoop`: one outstanding frame, dt clamped to max, `stop()` cancels, restart safe |

Mirror rule: a new `src/core` module ⇒ a `tests/core` file + a row here.
