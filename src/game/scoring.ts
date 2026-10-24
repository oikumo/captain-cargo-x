/**
 * Implements spec/scoring.md — `Scoring` class: pure, no three/DOM/wall
 * clock; time input = in-run seconds. OpSpec triples mirror the spec rows;
 * tests: tests/game/scoring.test.ts.
 */
export const COMBO_WINDOW_S = 1.5;
export const COMBO_STEP = 0.5;
export const COMBO_CAP = 4;

/**
 * Score + kill-streak chain (surge) state for one run.
 *
 * Pre: constructed fresh per run; `reset()` between runs.
 * Post: deterministic pure accounting — same calls ⇒ same points.
 */
export class Scoring {
  score = 0;
  streak = 0;
  private lastKillS = -1e9;

  /**
   * Add one verified kill to the streak chain (jets/drones/gunship).
   * Pre:  run is live; `nowS` = current in-run seconds.
   * Exc:  no streak entry (first kill) — silently seeds multiplier ×1.
   * Post: score raised by base × multiplier (cap ×4); a kill inside the
   *       1.5 s window keeps/increments the streak, otherwise it resets to 1.
   * Spec: spec/scoring.md chain rows are the test oracle.
   */
  addKill(nowS: number, base: number): number {
    const chained = nowS - this.lastKillS <= COMBO_WINDOW_S;
    this.streak = chained ? this.streak + 1 : 1;
    this.lastKillS = nowS;
    const mult = Math.min(1 + COMBO_STEP * (this.streak - 1), COMBO_CAP);
    const points = base * mult;
    this.score += points;
    return points;
  }

  /**
   * Small per-hit award for shield damage — streak-neutral by design.
   * Pre:  `base` ≥ 0.
   * Post: score raised by exactly `base`; streak untouched.
   */
  addShieldHit(base: number): number {
    this.score += base;
    return base;
  }

  /**
   * One-off objective bonus (shield break, dome destroy) — raw points.
   * Pre:  `points` ≥ 0.
   * Post: score raised by exactly `points`; streak untouched.
   */
  addFlat(points: number): number {
    this.score += points;
    return points;
  }

  /**
   * Full wipe on run start.
   * Post: score 0, streak 0, chain window disarmed.
   */
  reset(): void {
    this.score = 0;
    this.streak = 0;
    this.lastKillS = -1e9;
  }
}
