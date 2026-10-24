# src/ui — CONTEXT

DOM overlay layer — bus events in, elements out (spec/hud.md). No
three.js, no game state: scores/lives arrive as events; screens flip on
the `state` event.

| File | Role |
|---|---|
| `hud.ts` | `Hud` — bottom bar: 6 skewed lives bars · purple ship SVG · chunky score digits |
| `screens.ts` | `Screens` — start / paused / game-over overlays (`.hidden` toggling, final-score stash) |
| `styles.css` | HUD + screen styling (system chunky font stack — exact font is a spec/hud.md open item) |

Up: `../render/CONTEXT.md` · Down: `../../tests/CONTEXT.md`
