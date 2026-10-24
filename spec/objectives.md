# Spec — Objectives: shield domes

Status: draft — numbers are v1 proposals, confirm against prototype

## Structure

- Group: red hemispherical dome (r≈10) + translucent pink/orange shield
  bubble (r≈13) + 4 orbiting crates (decorative in v1).
- Floats over the ocean; does not interact with the water surface.

## Mechanic (v1 proposal)

1. Shield absorbs N hits (TBD, default 18). The dome ignores damage meanwhile.
2. On shield break: burst FX (expanding translucent sphere + particles),
   dome becomes vulnerable, one-time bonus award.
3. Dome takes M hits (TBD) → destroyed: explosion FX, largest score event.

## Feedback

- Shield pulse: opacity ~0.20–0.35, sine at ~6 Hz.
- Hit spark at the impact point; break and destroy use the blast-sphere FX.

## Spawning (v1)

- One dome at a time; spawns ~1500 u ahead on the player's current course
  after the previous dome is destroyed.
- Multiple simultaneous domes late-game: observed in footage, stage TBD.

## Open

- [ ] Crates: destructible? drop anything?
- [ ] Domes stationary vs. drifting on the course.
- [ ] Shield-hit SFX cadence.
