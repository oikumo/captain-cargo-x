# Spec — Scoring & lives model

Status: agreed — v0.0.1 first-playable values, pending prototype measurement
(GDD §6/§8). Numbers marked *proposal* live in the tuning class only.

## Module contract (`src/game/scoring.ts` — pure, unit-tested)

- Pure TypeScript class `Scoring` — no three.js, no DOM, no wall clock;
  time input = in-run seconds.
- Public API:
  - `addKill(nowS, base) → points awarded` — jets/drones/gunship, feeds the streak.
  - `addShieldHit(base) → points` — small per-hit award, streak-neutral.
  - `addFlat(points) → points` — one-off objective bonuses (shield break,
    dome destroy).
  - `reset()` — full wipe (score, streak, window) on run start.
- Properties exposed: `score` (total), `streak`.

## Chain (surge) rule — accepted v0.0.1 proposal

- A kill inside a **1.5 s** window of the previous kill keeps the streak alive.
- Multiplier = `1 + 0.5 × (streak − 1)`, capped at **×4**.
- Acceptance check: reproduce footage behavior — score visibly ~doubles
  within ~1 s during dense kill bursts (38,200 → 78,600).

## Values table (v0.0.1 — proposal)

| Event | v0.0.1 | Prototype |
|---|---|---|
| Jet kill (base) | 300 | TBD |
| Drone kill (base) | 100 | TBD |
| Shield hit | 50 | TBD |
| Shield break bonus | 2500 (flat) | TBD |
| Dome destroyed bonus | 5000 (flat) | TBD |
| Combo window | 1.5 s | TBD |
| Combo multiplier | 1 + 0.5·(streak−1), cap ×4 | TBD |
| Life loss | rammed, enemy shell hit | confirmed |
| I-frame duration | 1.5 s | TBD |

## Lives

- 6 bars. 0 bars → game over; restart resets score, streak and lives
  (controller owner: run model resets, controller transitions state).

## Open

- [ ] Measure all `Prototype` columns from the game-engine build / footage timeline.
- [ ] Bonus for destroying a full jet-chain set piece (chain is out of v0.0.1).
- [ ] Does flying into shallows/off-course cost anything? (GDD §9 Q3)
