# Spec — Enemies & threats

Status: agreed — v0.0.1 scope only; value rows carry v0.0.1 proposals
awaiting prototype measurement (GDD §8). Jet-chain is **out** of v0.0.1.

## Roster (v0.0.1: jets + drone + lock-on/shell)

| Threat | Formation | Behavior | Score |
|---|---|---|---|
| Grey jet | 3–6 in a line | straight-lines across the course, rams | 300 |
| Twin-boom drone | solo | slow, non-reactive patrol | 100 |
| Lock-on gunship | one event max at a time | drifts; green converging beams telegraph ~1.5 s; hp 3, killable | 300 |
| Enemy shell (after lock-on) | — | slow, dodgeable, straight unaimed shot | — |
| Jet chain | out of v0.0.1 | destruction rules TBD later | TBD |

## Shared behavior + v0.0.1 numbers

- All enemies follow straight/lerped paths — **no pursuit AI in v0.0.1**.
- Despawn when > 3200 m behind the player or |lateral| > 1200 m.
- Hit volumes are spheres: jet/gunship r 7 · drone r 8 · shell r 5
  (+ tracer r 2); no mesh-accurate collision.
- Ramming the player: enemy explodes, player loses 1 life (i-frame gate).
- Jet flight: speed 60 m/s, spawn 1400 m ahead, crossing heading ±20° off
  perpendicular, spacing 45 m along the flight path; cadence every 3–5 s
  (no difficulty scaling in v0.0.1).
- Drone: speed 28 m/s, spawn 500 m ahead, ±600 m lateral.
- Lock-on: cadence 8–12 s; gunship spawns 1200 m ahead at altitude ~60,
  drifts ±20 m/s lateral; telegraph 1.5 s → one shell (45 m/s) toward the
  player's position at lock moment (no tracking); shell dies at y ≤ 2
  (water splash) or after 6 s. Killing the gunship cancels its shell.

## Open

- [ ] Do non-lock-on jets ever fire in the prototype? (v0.0.1: shells strictly telegraphed)
- [ ] Jet-chain destruction rules + bonus (next slice).
- [ ] Difficulty curve — blocked on prototype measurement (GDD §8).
