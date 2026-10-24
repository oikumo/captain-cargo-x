# Spec — Scoring & lives model

Status: draft — values pending prototype measurement (GDD §6, §8)

## Module contract

- Pure TypeScript class `Scoring` — no three.js, no DOM; unit-tested (vitest).
- Time input = in-run seconds (deterministic per run; no wall-clock time).
- Public API:
  - `addKill(now, base) → points awarded` — jets/drones, feeds streak logic
  - `addShieldHit(base)` — small per-hit award
  - `addFlat(points)` — one-off objective bonuses (shield break, dome destroy)
  - `reset()` — full wipe on run start

## Chain (surge) rule — proposal

- A kill inside a ~1.5 s window of the previous kill keeps the streak alive.
- Multiplier = `1 + 0.5 × (streak − 1)`, capped at ×4.
- Acceptance check: must reproduce the footage behavior — score visibly
  ~doubles within ~1 s of footage during dense kill bursts (38,200 → 78,600).

## Lives

- 6 bars. Loss conditions (v1): rammed, enemy shell hit. Water/contact TBD.
- 0 bars → `gameover` state; restart resets score, streak, and lives.

## Open

- [ ] Exact base values — measure from Unity build or footage timeline first.
- [ ] Bonus for destroying a full jet chain set piece?
- [ ] Does flying into shallows/off-course cost anything?
