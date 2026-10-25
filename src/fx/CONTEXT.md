# src/fx — CONTEXT

Moment-driven FX views (three.js only): pooled visual reactions to bus
events + poll-only cosmetic views of model phase state.

| File | Role |
|---|---|
| `booms.ts` | `Booms` — 14-slot pooled burst table (particles + blast spheres) fed by `boom` bus events; GDD §11 vocabulary |
| `beams.ts` | `LockonBeams` — green converging telegraph beams (spec/enemies.md poll fields) |

No gameplay state written here; `Math.random` allowed (cosmetic, not seeded).

Up: `../CONTEXT.md` · Down: `../core/bus`, `../game` (read-only types)
