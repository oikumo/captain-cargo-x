# Spec — Enemies & threats

Status: draft — v1 scope only; grow iteratively

## Roster (v1)

| Threat | Formation | Behavior | Return |
|---|---|---|---|
| Grey jet | 3–6 in a line | straight-line flyby crossing the course; rams | score via `addKill` |
| Twin-boom drone | solo | slow, non-reactive patrol | TBD — keep or cut |
| Jet chain | long strung line | set-piece obstacle; destruction rules TBD | TBD |
| Lock-on beam → shell | one beam event max at a time | green converging beams ~1.5 s telegraph → slow dodgeable shell | — |

## Shared behavior

- All enemies follow straight/lerped paths — **no pursuit AI in v1**.
- Despawn when > 3200 u behind the player or outside world bounds.
- Hit volumes are spheres; no mesh-accurate collision in v1.
- Ramming the player: jet explodes, player loses 1 life.
- Spawn cadence: flight every ~3–5 s while playing (no scaling in v1).

## Open

- [ ] Do non-lock-on jets ever fire in the prototype?
- [ ] Drone: in or out of v1?
- [ ] Jet-chain destruction (link-by-link? all at once?).
- [ ] Difficulty curve — blocked on prototype measurement (GDD §8).
