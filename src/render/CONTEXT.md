# src/render — CONTEXT

View layer — three.js scene assembly. Polls the model every frame and
listens to bus booms for FX; never mutates game state (methodology §5).

| File | Role |
|---|---|
| `view.ts` | `GameView` — scene/camera, chase cam with bank roll, pooled entity meshes cloned from loader templates, dome shield pulse + crate orbit, muzzle/i-frame feedback, FX + ocean stepping, `render()` |

Up: `../fx/CONTEXT.md` · Down: `../ui/CONTEXT.md`
