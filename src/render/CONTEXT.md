# src/render — CONTEXT

Scene-assembly view layer (three.js only here): pooled entity renders +
the renderer/camera harness. Views **poll** RunModel state every frame
(read-only) — gameplay decisions never live here.

| File | Role |
|---|---|
| `scene.ts` | `SceneView` — WebGLRenderer + lights + damped chase camera (`follow`), `render()` per frame |
| `entities.ts` | `EntityViews` — one preallocated mesh per pool slot (jets 16 / drones 4 / shells 6 / tracers 64) + player/dome/gunship/crates; cosmetic feedback loops (muzzle, blink, thruster, shield pulse) |

Meshes are registry prototypes cloned once (spec/asset-pipeline.md keys).

Up: `../CONTEXT.md` · Down: `../loaders` (prototypes), `../game` (read-only)
