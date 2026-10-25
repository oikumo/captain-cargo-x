# tests/render — CONTEXT

Headless pool-sync smoke for the view layer (three.js geometry is pure; the
renderer itself stays out of unit scope, doc/omt-ts-methodology.md §11).
Deterministic: seeded run, injected dt, stubbed scene.

| File | Covers |
|---|---|
| `entities.test.ts` | `EntityViews` + `LockonBeams` 360-frame sync contract (no throw, no model writes); `Booms` slot claim/retire/reclaim for every boom kind |

Up: `../CONTEXT.md` · Down: `../../src/render/CONTEXT.md`
