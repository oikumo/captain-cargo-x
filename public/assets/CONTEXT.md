# public/assets — CONTEXT

Static artifacts served bare as `/assets/…` by Vite. Derived / ship
artifacts only — authored sources stay in `blender/`; exported `.glb` files
are never hand-edited (spec/asset-pipeline.md).

| Bucket | Content | Note |
|---|---|---|
| `models/` | `.glb` glTF 2.0, one per registry key, kebab-case | empty → procedural placeholders |
| `fonts/` | HUD digit font (pending prototype match, spec/hud.md) | none yet |
| `audio/` | SFX / music | none yet |
| `textures/` | intentionally empty — flat/vertex colors win | rule, not TODO |

Units: meters, Y-up. Load paths go exclusively through `src/loaders/`.
