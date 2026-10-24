# Spec — Asset pipeline (Blender → three.js)

Status: agreed — the placeholder system below is the v0.0.1 shipping route:
**the game boots with zero `.glb` files** and all visuals are procedural
low-poly primitives (boxes/spheres), per the v0.0.1 directive. Blender
sources land with the art pass; upgrading an asset stays drop-in.

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

## Loader & placeholder system (v0.0.1 shipping route)

- Registry exposes async per-key factories; each tries to load
  `assets/models/<key>.glb` via GLTFLoader; missing/unloadable file →
  procedural placeholder factory with the same scale & origin contract +
  one-line console info (no warning spam).
- v0.0.1 keys (placeholder geometry): `player` · `enemy-jet` ·
  `enemy-drone` · `gunship` · `objective-dome` · `objective-shield` ·
  `crate` · `tracer` · `shell`.
- Origin & scale contract (placeholders must honor): nose at −Z, origin at
  entity center, meters — player/jet/gunship/drone ≈ 1:1 with the hit
  radii in `spec/enemies.md`; dome hemisphere r 10, shield sphere r 13.
- Hard requirement: the game runs completely with zero `.glb` files present,
  and upgrading an asset is a drop-in with no gameplay-code changes.

## Open

- [ ] Automated export (Blender CLI) vs. manual export checklist.
- [ ] Polycount / triangle budget per category.
- [ ] Origin & scale contract table per key (nose at −Z, etc.).
