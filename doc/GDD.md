# Captain Cargo X — Game Design Document (GDD)

> **Incremental document.** Sections are intentionally brief; **TBD** marks open
> areas to be filled in as the TypeScript port progresses.
> Baseline for gameplay behavior = the Unity prototype (see `AGENTS.md` §2).
> Any intentional divergence from the prototype must be written down here.

## Changelog
| Date | Change |
|---|---|
| 2026-10-24 | Initial stub, gameplay mechanics focus. |

---

## 1. Vision

- **One-liner:** arcade 3D shoot-'em-up — pilot a purple hover-fighter over a
  low-poly ocean, shred enemy flights, break shield bubbles, top the score.
- Feel keywords: arcade spectacle, chunky score digits, constant forward
  momentum, easy to learn, hard to master.
- Port success criterion: the TS/three.js build *feels* like the Unity
  prototype (speed, cadence, punch). **TBD** — define measurable acceptance
  checks (e.g. timing comparisons).

## 2. Core loop

1. Craft flies forward automatically over the ocean.
2. Threats appear ahead: jet formations, drones, shielded dome objectives.
3. Player steers, dodges, and fires to destroy threats.
4. Score climbs in steps, with big surges on chained kills and shield breaks.
5. Mistakes cost lives (6 bars). **TBD:** end-of-run condition — endless score
   attack vs. stage/boss structure (the prototype footage suggests boss
   framing — "¿EL JEFE ES REAL?").

## 3. Player ship

| Mechanic | Status | Notes |
|---|---|---|
| Auto forward flight (constant base speed) | confirmed in prototype | speed **TBD** |
| Steering: yaw + banking roll | confirmed | turn rate **TBD** |
| Altitude: bounded climb/dive band | confirmed visually | band + impact on gameplay **TBD** |
| Cannon: rapid-fire tracer projectiles | confirmed | cooldown, spread **TBD** |
| Damage: hit → life lost (+ i-frames?) | partially observed | i-frames **TBD** |
| Thruster trail (blue glow) | cosmetic | |
| Boost / sprint / pickups | **TBD** | not observed in footage |

## 4. Enemies & threats

| Threat | Behavior | Danger | Score (base) |
|---|---|---|---|
| Grey jet formation | flies across the course in squadrons of ~3–6 | ram attack | 300 **TBD** |
| Twin-boom patrol drone | slow, solo, unintelligent | low | **TBD** |
| Jet-chain set piece | long line of aircraft strung across the sky | obstacle | **TBD** — destructible link-by-link? |
| Green lock-on beams | converging beams telegraph aimed fire | telegraph only (the follow-up shell is the danger) | — |
| Enemy shell (after lock-on) | slow, dodgeable projectile | hit → life | — |
| Spawn director | rounds of flights with rising pressure | — | **TBD** cadence & difficulty curve |

**Open question TD:** do enemy jets shoot in the prototype outside lock-on
events, or are shells strictly telegraphed?

## 5. Objectives — shield domes

- Red hemispherical dome wrapped in a translucent **pink/orange shield
  bubble**, crates/props orbiting it. Floating over the ocean; also appears
  near islands.
- Proposed mechanic (confirm against prototype):
  1. Shield absorbs N hits while dome is invulnerable (N **TBD**).
  2. Shield breaks (visual burst) → dome becomes vulnerable.
  3. Dome destroyed → large score surge (footage shows the biggest jumps,
     e.g. 38,200 → 78,600, coincide with these events).
- **TBD:** shield HP, hit feedback, spawn cadence, dome variants (multiple
  domes appear simultaneously in late footage), crates decorative or
  destructible.

## 6. Scoring & lives

- HUD: lives bars (6) — ship icon — score counter (right, chunky digits).
- **Chain-kill surges:** kills within a short window multiply score (footage
  score roughly doubles within ~1 s of footage, 38,200 → 78,600).
- Values table to be measured from the Unity build:

| Event | Prototype value |
|---|---|
| Jet kill (base) | TBD |
| Drone kill (base) | TBD |
| Shield hit | TBD |
| Shield break bonus | TBD |
| Dome destroyed bonus | TBD |
| Combo window length | TBD |
| Combo multiplier rule | TBD |
| Life loss conditions | TBD |
| I-frame duration | TBD |

- Game over at 0 lives → score screen → restart. **TBD:** high-score storage,
  checkpointing.

## 7. Controls (draft mapping)

| Action | Input |
|---|---|
| Steer left/right | ← / → or A / D |
| Climb / dive | ↑ / ↓ or W / S |
| Fire | Space (mouse button?) |
| Start | Enter |
| Restart | R |
| Pause | P |
| Touch/gamepad support | **TBD** |

## 8. Tuning values — extract from the Unity prototype

Port rule: **measure, don't invent.** The Unity project should be instrumented
or timed from footage to fill the TBD tables above before tuning the TS build:

- [ ] Base speed (u/s) and real-world scale
- [ ] Turn rate / turn radius at speed
- [ ] Fire cooldown & tracer speed
- [ ] Jet flight speed & spawn cadence
- [ ] Shield HP / dome HP
- [ ] Score values & combo window (derive from footage timestamps)
- [ ] I-frame duration, life-loss conditions
- [ ] Idle bob / camera lag feel

## 9. Open questions

1. Pickup/power-up system present in the prototype? (floating canisters seen
   in footage — pickups, debris, or decoration?)
2. Structure: endless, stage-based, or boss-run? Wording suggests a boss build.
3. Are shallow teal waters purely a visual off-course cue, or hazardous?
4. Difficulty escalation over distance?
5. Multiple domes at once late-game — escalating objective waves?
