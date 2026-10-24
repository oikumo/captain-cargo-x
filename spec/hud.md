# Spec — HUD

Status: draft

## Layout (bottom overlay bar)

- Fixed bar, full viewport width, ~12 px above the bottom edge; three zones:
  - **Left:** lives bars — 6 slightly skewed rounded rectangles (~14×34 px).
  - **Center:** ship icon — static inline SVG, top-down jet silhouette, purple.
  - **Right:** score counter — chunky white digits (~44 px) with a dark soft
    outline, larger letter-spacing.
- HUD is `pointer-events: none` and is **pure DOM** — no three.js objects in
  the HUD layer.

## Behavior

- Lives: remaining bars full-opacity; lost bars dim to ~0.25 (no exit anim).
- Score: always-visible right-aligned digits; jumps from surges render nearly
  instantly. Ease-out ~120 ms is a variant to verify against the prototype.
- Updates flow **exclusively via the event bus** (`score`, `lives` events);
  the HUD module holds no game state of its own.

## Screens (overlays)

- **Start:** title "CAPTAIN CARGO X" + input hints; `Enter` starts.
- **Game over:** final score + `R` restart hint.
- Both: semi-transparent dark backdrop, shown/hidden via a `.hidden` class.

## Open

- [ ] Surge feedback on combo (digit bump / flash)?
- [ ] Damage flash / vignette on life loss?
- [ ] Exact font — match the prototype's chunky digits (asset, not CSS guess).
