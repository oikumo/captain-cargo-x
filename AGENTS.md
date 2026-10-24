# AGENTS.md — Captain Cargo X

**3D arcade air/sea combat shoot-'em-up.** A full TypeScript browser port of
the original game-engine prototype: WebGL rendering with **three.js**, models
authored in **Blender** and imported as glTF 2.0 (`.glb`). Art direction:
low-poly / retro (PS1–N64 era) flat-shaded — simple geometry, simple skies and
water. Reproduce the original's *feel* (flight model, pacing, HUD, scoring),
not its implementation details.

> **Design truth (source of gameplay decisions): `doc/GDD.md` §1–11.**
> Port rule there: *measure, don't invent* (GDD §8) — when behavior is
> ambiguous, ask or propose rather than quietly adding it.

## Layer map (rules: `spec/README.md`)

`AGENTS.md` (workspace rules) → `doc/GDD.md` (design intent) →
`spec/*.md` (technical contracts) → `src/` (the port). Blender sources in
`blender/` are the art source of truth; `public/assets/models/` holds only
exported `.glb` artifacts — kebab-case names, meters, Y-up
(pipeline rules: `spec/asset-pipeline.md`).

`src/` layout: `core/` (loop, states, input, persistence) · `game/` (player,
enemies, scoring, waves) · `world/` (ocean, coast, islands) · `fx/` ·
`ui/` (HUD) · `loaders/` (glTF registry) · `utils/` — plus `tests/` for
deterministic logic and `scripts/acyx/` for the harness.

## Conventions

- TypeScript **strict**; no `any` without a why-comment. One class/module per
  file; kebab-case file names, PascalCase classes. Units: meters/seconds;
  radians at API boundaries. Seed the RNG for gameplay-affecting rolls.
- Runtime priority: the 60 fps loop budget. No per-frame allocations in hot
  paths; pool particles/projectiles. OpSpec TSDoc triples on public model
  methods, citing spec rows (methodology §10).
- Gameplay logic is engine-free — entities publish state; a view layer
  renders. Import policy + detectors: `doc/omt-ts-methodology.md` §5/§16,
  enforced by `npm run harness`.
- Public APIs in **radians**; specs stay thin (`draft → agreed → implemented`
  statuses governed by `spec/meta-harness.md` R2).

## Process baseline — paper harness (`spec/meta-harness.md`, R1–R5)

1. **R1** — declare every non-trivial `src/` task in `WORK.md`
   (`[ ]` → `[~]` → `[x]` + commit ref + spec pointer).
2. **R2** — write code for a spec only once its status ≥ `agreed`.
3. **R3** — persistent `TA:` gotcha comments; re-read (grep) tagged files
   before editing; tags are never deleted silently.
4. **R4** — byte budgets on agent-facing files, enforced by the harness.
5. **R5** — no task closes `[x]` until `npm run harness` is green.

Commits: `<tag>(<area>): <subject>`, tag ∈
`feat|fix|refactor|test|docs|art|state` (areas like `fx`, `hud`, `player`).
Method phases: `doc/omt-ts-methodology.md` (OMT++ TS adaptation).
