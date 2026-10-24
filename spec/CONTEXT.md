# spec — CONTEXT

Technical contracts — *what the implementation must do*. Code implements a
spec only once its status ≥ `agreed` (meta-harness R2). Every spec opens with
a status line `draft → agreed → implemented → frozen`; rules + index live in
`README.md`. Cap: each file ≤ 8 KiB (R4).

| File | Topic | Status |
|---|---|---|
| `asset-pipeline.md` | Blender → glTF → three.js; placeholder factories (zero-`.glb` boot) | draft |
| `enemies.md` | v1 roster: jets, drone?, jet-chain, lock-on beam/shell | draft |
| `hud.md` | pure-DOM bottom bar: lives / ship / score; start + game-over overlays | draft |
| `meta-harness.md` | paper harness process contract (R1–R6) | implemented |
| `objectives.md` | shield-dome mechanics, spawn cadence | draft |
| `scoring.md` | `Scoring` class; chain-surge rule; 6 lives | draft |

Rules: one topic per file, kebab-case; grows only when decisions are actually
made; *specific beats vague* — TBD beats silently invented behavior; a spec
moves with the code it describes (same change, `docs:` prefix).

Up: `../doc/CONTEXT.md` (design truth) · Down: `../src/CONTEXT.md`
