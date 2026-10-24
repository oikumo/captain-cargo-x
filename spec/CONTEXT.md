# spec — CONTEXT

Technical contracts — *what the implementation must do*. Code implements a
spec only once its status ≥ `agreed` (meta-harness R2). Every spec opens with
a status line `draft → agreed → implemented → frozen`; rules + index live in
`README.md`. Cap: each file ≤ 8 KiB (R4).

| File | Topic | Status |
|---|---|---|
| `asset-pipeline.md` | Blender → glTF → three.js; placeholder factories (zero-`.glb` boot) | agreed |
| `enemies.md` | v0.0.1 roster: jets, drone, lock-on gunship → shell (jet-chain: later) | agreed |
| `hud.md` | pure-DOM bottom bar: lives / ship / score; start + game-over overlays | agreed |
| `meta-harness.md` | paper harness process contract (R1–R6, v1.3 mechanical) | implemented |
| `objectives.md` | shield-dome mechanics, spawn cadence: 18 shield / 10 dome hits | agreed |
| `player.md` | hover-fighter: flight, cannon, damage/i-frames (v0.0.1) | agreed |
| `scoring.md` | `Scoring` class; chain-surge rule; 6 lives | agreed |

Rules: one topic per file, kebab-case; grows only when decisions are actually
made; *specific beats vague* — TBD beats silently invented behavior; a spec
moves with the code it describes (same change, `docs:` prefix).

Up: `../doc/CONTEXT.md` (design truth) · Down: `../src/CONTEXT.md`
