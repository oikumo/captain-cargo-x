# src/ui — CONTEXT

DOM overlay layer — HUD + screens per spec/hud.md. Reacts to bus events
only (`score`, `lives`, `state`); holds no game state; **no `three`**;
pointer-events none.

| File | Role |
|---|---|
| `hud.ts` | `Hud` — binds `#hud` (6 lives bars / ship icon / score) + `#screens` (start/gameover/paused overlays, `.hidden` toggles); repaint is event-only |

Up: `../CONTEXT.md` · Down: `../core/bus` (events only)
