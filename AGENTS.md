# AGENTS.md — Captain Cargo X

Guidance for AI agents (and humans) working in this repository: what the project
is, how the workspace is organized, and the rules to follow when changing it.

---

## 1. Project overview

**Captain Cargo X** is a 3D arcade air/sea combat shoot-'em-up.

- The game **originated as a prototype made in Unity** by the project author.
- The goal of this repository is a **full port to TypeScript**, rendering with a
  WebGL 3D library (**three.js**) and running in the browser as a web game.
- All 3D models are authored in **Blender** and imported as **glTF 2.0 (`.glb`/`.gltf`)**.
- Art direction: **low-poly / retro (PS1–N64 era) flat-shaded** look — simple
  geometry, flat colors, simple skies and water planes. Do not chase realism.

The port should faithfully reproduce the original game's *feel* (flight model,
pacing, HUD, scoring) rather than its Unity implementation details.

## 2. Reference: the original Unity game (design spec)

Porting agents should treat this section as the source of truth for gameplay.
It documents how the Unity prototype plays (observed from gameplay footage).

### 2.1 Player

- Purple/lavender hover-style fighter jet with twin engines and a glowing
  blue thruster/energy trail.
- Third-person chase camera flying low over the ocean surface.
- Controls involve forward flight with implicit or explicit banking/steering.

### 2.2 HUD

Bottom bar with three elements:

| Element | Behavior |
|---|---|
| Lives indicator | Row of bar icons (6 bars in the reference runs). Fully depleted → game over. |
| Player ship icon | Small iconographic reference to the active craft. |
| Score counter | Right-aligned numeric score; increases in ~100–1,000 steps, with large jumps on chained/bonus kills. |

### 2.3 World

- **Ocean**: vast low-poly sea with subtle wave shading. Shallow coastal areas
  render lighter teal — usable as an implicit "off-course" visual cue.
- **Coastline / islands**: land strips appear as course corners; islands carry
  props (crates, barrels, dark blocks, grey rock formations, runway-like planes).
- **Enemies and set pieces in the sky**: formations of grey aircraft, sometimes
  **chains of aircraft strung together in a line** (a distinctive set piece).

### 2.4 Enemies & objectives

- Grey jet fighters in squadrons/formation attacks.
- Twin-boom patrol drone aircraft (dumb, slow, solo).
- **Red hemispherical dome objectives** protected by a translucent
  pink/orange **shield bubble**; crates and props orbit them. Breaking the
  shield and destroying the dome is a core scoring event.
- Small speaker/canister-like floating gadgets (context pickups or debris).

### 2.5 FX vocabulary

- Orange tracer projectiles and cannon muzzle flashes.
- Large particle explosions on kills.
- Pink/orange translucent blast/shield-burst spheres.
- Green multi-beam targeting lasers (lock-on / aimed enemy fire).
- Water splash particles.

## 3. Tech stack

| Layer | Choice |
|---|---|
| Language | TypeScript (strict mode) |
| Renderer | three.js |
| Bundler / dev server | Vite (assumed — repo `.gitignore` uses the standard Vite template) |
| Models | Blender → glTF 2.0 (`.glb`), low-poly, flat-shaded |
| Package manager | npm |

> If the build tool changes (e.g. esbuild, Rollup, no bundler), update this
> table and the directory layout below.

## 4. Workspace layout

The repo currently boots more or less empty (LICENSE, .gitignore). The intended
layout once the port scaffolds is:

```
captain-cargo-x/
├── AGENTS.md              # this file
├── LICENSE
├── README.md              # to be added
├── doc/                   # design documents
│   └── GDD.md             # game design document (incremental)
├── spec/                  # technical specs — markdown, iterative (index: spec/README.md)
├── package.json
├── tsconfig.json
├── vite.config.ts
├── index.html
├── public/
│   └── assets/
│       ├── models/        # *.glb exported from Blender
│       ├── textures/      # minimal — art style favors flat colors
│       ├── audio/         # sfx / music
│       └── fonts/         # HUD font (score digits look chunky/retro)
├── blender/               # Blender source files (*.blend) — never render-time assets
│   ├── player/
│   ├── enemies/
│   ├── environments/
│   └── fx/
├── src/
│   ├── main.ts            # entrypoint: renderer/scene/loop bootstrap
│   ├── core/              # game loop, state machine, input, events, save
│   ├── game/              # gameplay: player, enemies, objectives, scoring, waves
│   ├── world/             # ocean, coastline, islands, props
│   ├── ui/                # HUD (lives/score), menus, overlays
│   ├── fx/                # particles, tracers, explosions, lasers, splashes
│   ├── loaders/           # glTF loading, asset registry, Blender export mapping
│   └── utils/             # math, random, pooling, etc.
└── tests/                 # unit tests for deterministic logic (scoring, colliders)
```

Rules for the layout:

- Keep gameplay logic **free of direct three.js scene mutation where practical**
  — prefer entities publishing state that a presentation/view layer renders.
  This keeps the port testable and mirrors the original's decoupled systems.
- Art **source of truth lives in `bin/blender/`**; `public/assets/models/` holds
  only *exported* artifacts (never hand-edit those).

## 5. Asset pipeline (Blender → three.js)

- Export format: **glTF 2.0 binary (`.glb`)**, one file per asset
  (player ship, each enemy, dome, ocean tile, etc.).
- Prefer **flat colors / vertex colors or simple materials**; avoid textures
  unless clearly needed by the retro aesthetic (HUD font is fine).
- Naming convention (enforced by `src/loaders/` keys):
  - kebab-case files: `player-hover-fighter.glb`, `enemy-grey-jet.glb`,
    `objective-red-dome.glb`, `setpiece-jet-chain.glb`.
  - Embedded animations allowed; name them (thrusters, prop spin, damage).
- Scale/axis: glTF is meters, right-handed, Y-up — matches three.js by default;
  author in that space inside Blender to avoid import fixups.
- Keep polycounts low; the look is intentionally simple geometry.

## 6. Conventions

- TypeScript strict; no `any` without a comment explaining why.
- One class/module per file; kebab-case file names, PascalCase classes.
- Units: meters/seconds; angles in **radians** at API boundaries.
- Determinism where it matters: seed the RNG for wave spawning/scoring so runs
  are reproducible; never use unseeded randomness for gameplay-affecting rolls
  without noting it.
- Runtime priority: **60 fps game loop budget**. Pool particles/projectiles;
  avoid per-frame allocations in hot paths.

## 7. Agent guidance

- **Read this file first.** If gameplay behavior is ambiguous, fall back to the
  design spec in §2; if it contradicts new user instructions, the user wins and
  this file should be updated in the same change.
- Do not invent mechanics that are not in §2 — when a needed behavior isn't
  documented, ask, or propose it explicitly rather than quietly adding it.
- Record decisions in the right layer: design intent → `doc/GDD.md`,
  technical contracts → `spec/*.md` (start minimal, grow with the code —
  see `spec/README.md` for spec rules and the index).
- Preserve the game's *identity*: purple player craft over a low-poly ocean,
  shield-bubble dome objectives, chunky retro score digits, chain-kill score
  surges.
- Commit messages: short imperative summary; relevant gameplay area as prefix
  (`fx:`, `enemies:`, `hud:`, `player:`, `assets:`, `docs:`).
