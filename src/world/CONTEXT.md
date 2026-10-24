# src/world — CONTEXT

View layer — environment meshes (engine imports allowed, methodology §5).
Never reads or mutates model state; positions are passed in per frame.

| File | Role |
|---|---|
| `sky.ts` | `applySky(scene)` — background + fog matched to `SKY_COLOR`, hemisphere light + directional sun |
| `ocean.ts` | `Ocean` — 4200² plane, 6.5 k verts of CPU sine waves written into one preallocated buffer; recenters under the player |

Up: `../CONTEXT.md` · Down: `../fx/CONTEXT.md`
