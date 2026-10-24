# Spec — Player hover-fighter

Status: agreed — v0.0.1 first-playable numbers are **port proposals** (GDD §8
*measure, don't invent*); the tuning class replaces them with measured values.

## Flight model (GDD §3 rows)

| Param | v0.0.1 | Status |
|---|---|---|
| Base forward speed | 120 m/s, constant, unconditional while playing | proposal |
| Steer (yaw) rate | ±1.6 rad/s linear | proposal |
| Bank | visual-only roll ≤ 0.6 rad, damped 8 s⁻¹ toward steer | proposal |
| Climb/dive | ±24 m/s, band y ∈ [10, 90] (hard clamp) | proposal |
| Nose orientation | −Z at yaw 0; yaw θ ⇒ forward (−sin θ, 0, −cos θ); radians at API | contract |

## Cannon (rapid-fire tracers)

| Param | v0.0.1 |
|---|---|
| Cooldown | 0.10 s |
| Tracer speed / life | 320 m/s · 3.5 s (dies at water y ≤ 1.5) |
| Spread | ±0.02 rad per axis (cosmetic) |
| Pool | 64 tracers, ring overwrite (no per-frame allocation) |

## Damage (loss conditions per spec/scoring.md lives)

- One accepted hit = 1 life. Accepted hits arm **1.5 s i-frames**; further
  hits inside the window are ignored (`tryHit() → false`).
- v1 loss conditions: rammed by jet/drone, enemy shell hit. Ocean/altitude
  contact: none in v0.0.1.

## Module contract (`src/game/player.ts` — model layer, no three)

- `update(dt, steer, climb, fireHeld, tracers)` — kinematics + fire intent;
  spawns tracers via the pool when cooldown is clear and fire is held.
- `tryHit(): boolean` — i-frame gate; `true` means a life is lost.
- Exposes x/y/z, yaw (rad), bank (rad), `muzzleS` remaining, `invulnS`
  remaining for view polling only.

## Open

- [ ] Speed / turn rate / band / bob cycle from prototype instrumentation (GDD §8).
- [ ] Boost, pickups (unobserved in footage) — out of v0.0.1.
