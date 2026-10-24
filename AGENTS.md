# AGENTS.md — Captain Cargo X

**3D arcade air/sea combat shoot-'em-up.** Full TypeScript browser port of
the original game-engine prototype: WebGL rendering with **three.js**, models
authored in **Blender**, imported as glTF 2.0 (`.glb`). Art direction:
low-poly / retro (PS1–N64 era) flat-shaded — simple geometry, simple skies
and water. Reproduce the prototype's *feel* (flight model, pacing, HUD,
scoring), not its implementation details.

> **Design truth (source of gameplay decisions): `doc/GDD.md` §1–11.** Port
> rule there: *measure, don't invent* (GDD §8) — when behavior is ambiguous,
> ask or propose rather than quietly adding it.

## Navigation (R6) — context first, always

1. **Read the map, then the folder's `CONTEXT.md` before entering or
   analyzing it.** The map says where to go; the `CONTEXT.md` says what each
   file is before the files do.
2. **Navigate by chains:** every `CONTEXT.md` links Up/Down and lists its
   files. Follow links between folders instead of guessing sibling paths;
   read one folder, hop to the next.
3. **Stay in sync:** a folder lands **with** its `CONTEXT.md` (≤ 2 KiB,
   harness-checked); add/rename/delete files ⇒ update that `CONTEXT.md` in
   the same change.

```
ROOT      AGENTS.md (rules + map, ≤4 KiB) · WORK.md (task ledger, ≤10 KiB) ·
          build boilerplate: vite.config.ts, tsconfig.json, index.html,
          package.json, README.md (plain app config — no map row needed)
doc/      design truth: GDD (§1–11) + TS methodology guide   (≤24 KiB each)
spec/     thin contracts, status gate; index: spec/README.md (≤8 KiB each)
src/      the port → core/ controller · game/ model (planned) ·
          render|world|fx/ view (planned) · ui/ HUD (planned) ·
          loaders/ gateway (planned) · utils/ pure · main.ts bootstrap
tests/    vitest, mirrors src/ — deterministic, injected clocks
scripts/acyx/   harness.ts — the ONE check: npm run harness (R5 gate)
public/assets/  served artifacts: models .glb (derived), fonts, audio
blender/        art source of truth (.blend; lands with the art pass)
```

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

## Process baseline — paper harness (`spec/meta-harness.md`, R1–R6)

1. **R1** — declare every non-trivial `src/` task in `WORK.md`
   (`[ ]` → `[~]` → `[x]` + commit ref + spec pointer).
2. **R2** — write code for a spec only once its status ≥ `agreed`.
3. **R3** — persistent `TA:` gotcha comments; re-read (grep) tagged files
   before editing; tags are never deleted silently.
4. **R4** — byte budgets on agent-facing files, enforced by the harness
   (specs · GDD · WORK · this file · every `CONTEXT.md`).
5. **R5** — no task closes `[x]` until `npm run harness` is green.
6. **R6** — nav maps: `CONTEXT.md` per folder; read-before-enter; updates ride
   the change (§Navigation above).

Commits: `<tag>(<area>): <subject>`, tag ∈
`feat|fix|refactor|test|docs|art|state` (areas like `fx`, `hud`, `player`).
Method phases: `doc/omt-ts-methodology.md` (OMT++ TS adaptation).
