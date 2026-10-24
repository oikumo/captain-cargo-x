# tests — CONTEXT

vitest suite — `npm test` locally, always run by `npm run harness` (R5).
Mirrors `src/` one-to-one by folder. Deterministic only: inject clocks and
partners (methodology §12), never real rAF / timers / wall time.

| Folder | Mirrors | Covers today |
|---|---|---|
| `core/` | `src/core` | `GameLoop`: cadence, clamped deltas, stop/restart |
| `utils/` | `src/utils` | `clampDelta` bounds |

New `src/<x>/` ⇒ new `tests/<x>/` + a row here, in the same change.
