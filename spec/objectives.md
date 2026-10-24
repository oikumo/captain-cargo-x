# Spec — Objectives: shield domes

Status: agreed — v0.0.1 numbers are proposals (measured values replace them,
GDD §8); mechanics rows are the v0.0.1 implementation contract.

## Structure

- Group: red hemispherical dome (r 10) + translucent pink/orange shield
  bubble (r 13) + 4 orbiting crates (decorative in v0.0.1, orbit r 16).
- Floats at y = 30 over the ocean; no interaction with the water surface.

## Mechanic (v0.0.1 values)

1. Shield absorbs **18** tracer hits (50 pts each). Dome ignores damage meanwhile.
2. On shield break: burst FX (expanding translucent blast sphere + particles),
   dome becomes vulnerable, one-time **2500** flat award (no streak).
3. Dome takes **10** hits → destroyed: explosion FX + **5000** flat award —
   the largest score event in v0.0.1.

## Feedback

- Shield pulse: opacity 0.27 ± 0.08, sine at ~6 Hz on the run clock.
- Tracer impact: one-shot hit spark; break and destroy use blast-sphere FX
  plus a particle burst.

## Spawning (v0.0.1)

- One dome at a time. Spawns ~1500 m ahead on the player's current course
  (±120 m lateral) **2.5 s** after the previous dome is destroyed **or if it
  was flown past** (behind > 200 m → despawn without score, next dome queued).
- Multiple simultaneous domes late-game: observed in footage, stage TBD.

## Open

- [ ] Crates: destructible? drop anything? (decorative in v0.0.1)
- [ ] Drifting vs. stationary domes (stationary in v0.0.1).
- [ ] Shield-hit SFX cadence (no audio in v0.0.1).
