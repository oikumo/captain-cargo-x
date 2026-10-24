# src/fx — CONTEXT

View layer — FX vocabulary (doc/GDD.md §11): particle bursts, blast
spheres, lock-on beams. All pooled, preallocated; FX randomness is
deliberately unseeded (cosmetic only — gameplay rolls stay seeded in
src/game, methodology §16 #8).

| File | Role |
|---|---|
| `bursts.ts` | `Bursts` — 240-slot THREE.Points, additive fade-out; `BURST_SPECS` recipe table per boom kind |
| `blast.ts` | `Blasts` — 6 translucent spheres expanding + fading (shield break / dome destroy) |
| `beams.ts` | `LockonBeams` — 3 green additive beams, gunship→player, telegraph-only, ~4.5 Hz flicker |

Up: `../world/CONTEXT.md` · Down: `../render/CONTEXT.md`
