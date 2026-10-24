# Spec — Asset pipeline (Blender → three.js)

Status: draft

## Sources vs. derivatives

- Author in `blender/<category>/` (`player`, `enemies`, `environments`, `fx`)
  as `.blend` files — source of truth.
- Exports land in `public/assets/models/` — derived artifacts only, never
  hand-edited.

## Export rules

- Format: glTF 2.0 binary (`.glb`); meters, Y-up (matches three.js defaults).
- One file per asset; file name = registry key, kebab-case (e.g. `player.glb`,
  `enemy-jet.glb`, `objective-dome.glb`, `objective-shield.glb`, `crate.glb`).
- Animations embedded and named (thrusters, prop spin, damage).
- Materials: flat colors / vertex colors; no textures unless the retro look
  genuinely requires them.

## Loader & placeholder system (v0 — while no .glb files exist yet)

- Registry exposes per-key async factories; each tries to load
  `assets/models/<key>.glb` via GLTFLoader.
- Missing/unloadable file → **procedural placeholder factory** with the same
  scale & origin contract, plus a one-line console info (no warnings spam).
- Hard requirement: the game runs completely with zero `.glb` files present,
  and upgrading an asset is a drop-in with no gameplay-code changes.

## Open

- [ ] Automated export (Blender CLI) vs. manual export checklist.
- [ ] Polycount / triangle budget per category.
- [ ] Origin & scale contract table per key (nose at −Z, etc.).
