# Spec folder — Captain Cargo X

Technical specs for the TypeScript / three.js port. Layer map:

- `AGENTS.md` — workspace rules & project context
- `doc/GDD.md` — game design intent (what the game *is*)
- `spec/` — technical contracts (what the implementation *must do*)
- `src/` — the port itself

## Rules

1. All specs are Markdown, one topic per file, kebab-case file names.
2. Iterative by default: start minimal, grow only when decisions are actually made.
3. Specific beats vague; a `TBD` beats silently invented behavior.
4. Every spec opens with a status line: `draft → agreed → implemented → frozen`.
5. A spec moves with the code it describes (same change, `docs:` commit prefix).

## Index

| Spec | Topic | Status |
|---|---|---|
| `hud.md` | HUD layout & behavior | draft |
| `scoring.md` | Score, chain surges, lives model | draft |
| `enemies.md` | Enemy roster & threat behavior | draft |
| `objectives.md` | Shield-bubble dome objectives | draft |
| `asset-pipeline.md` | Blender → glTF → three.js + placeholder system | draft |
