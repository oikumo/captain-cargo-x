# src/loaders — CONTEXT

Gateway layer: all external I/O for assets (methodology §5, §7). The glTF
registry + placeholder factories per `spec/asset-pipeline.md` — the game
boots with **zero `.glb`** files and every derived asset is a drop-in.

| File | Role |
|---|---|
| `registry.ts` | `loadRegistry()` — per-key `.glb` attempt → placeholder fallback + one-line info; called once at boot |
| `placeholders.ts` | `placeholderFor(key)`, `AssetKey`/`REGISTRY_KEYS` — procedural low-poly prototypes (nose −Z, center origin, meters) |

No gameplay logic here; views clone registry prototypes into their pools.

Up: `../CONTEXT.md` · Down: `../render/`, game model state (via views)
