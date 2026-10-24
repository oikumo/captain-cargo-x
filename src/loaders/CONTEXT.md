# src/loaders — CONTEXT

Gateway layer — the only place assets enter (methodology §7). Async
per-key registry tries `assets/models/<key>.glb`; absence falls back to
procedural placeholders (spec/asset-pipeline.md). Zero-`.glb` boot is a
hard requirement; upgrades are drop-in.

| File | Role |
|---|---|
| `registry.ts` | `MODEL_KEYS`, `loadModel(key)`, `loadAll()` — GLTFLoader attempt → placeholder fallback, one console info per key |
| `placeholders.ts` | `buildPlaceholder(key)` — flat-shaded boxes/spheres per key; nose −Z, origin center, meters; radii match the hit volumes |

Up: `../CONTEXT.md` · Down: `../../public/assets/models/CONTEXT.md`
