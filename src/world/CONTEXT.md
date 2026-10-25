# src/world — CONTEXT

Environment view layer (three.js only here): static/ambient world meshes
that poll nothing but position anchors. Placeholder visuals ride the
`spec/asset-pipeline.md` zero-`.glb` route.

| File | Role |
|---|---|
| `ocean.ts` | `Ocean` — 7.7 k-vert CPU-wave plane following the player; shallow-teal vertex colors; zero per-frame allocation |
| `sky.ts` | `Sky` — night background + fog wall + star shell (static) |

Up: `../CONTEXT.md` · Down: none (leaf views)
