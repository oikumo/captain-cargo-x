/**
 * Implements spec/objectives.md — shield-bubble dome objective.
 * Pure state + count-down lifecycle; hit resolution and FX/score routing
 * live in `RunModel`. v0.0.1 values (18 shield / 10 dome) are the spec's
 * proposal numbers pending measurement.
 */
export const SHIELD_RADIUS = 13;
export const DOME_RADIUS = 10;
export const DOMED_ALT = 30; // floats at fixed altitude
export const SHIELD_HITS = 18;
export const DOME_HITS = 10;
export const FIRST_DOME_DELAY_S = 2.0;
export const RESPAWN_DELAY_S = 2.5;

/**
 * One dome slot (schools later — v0.0.1 keeps a single active dome).
 * Pre: one instance owned by `RunModel`.
 * Post: lifecycle `countdown → active (spawn) → gone (break/pass)`;
 *       collision radii read-only for the run's sphere tests.
 */
export class DomeObjective {
  active = false;
  /** Shield phase flag: true once the 18-hit buffer is spent. */
  broken = false;
  x = 0;
  y = DOMED_ALT;
  z = 0;
  shieldHp = SHIELD_HITS;
  domeHp = DOME_HITS;
  private countdown = FIRST_DOME_DELAY_S;

  /**
   * Place the dome at a world position (director path and the deterministic
   * test seam both land here).
   * Post: active, shield restored, both HP pools full.
   */
  spawnAt(x: number, y: number, z: number): void {
    this.x = x;
    this.y = y;
    this.z = z;
    this.active = true;
    this.broken = false;
    this.shieldHp = SHIELD_HITS;
    this.domeHp = DOME_HITS;
  }

  /**
   * Queue the next spawn after `delay` seconds (start of run, after destroy,
   * or after fly-past cull).
   * Post: inactive; countdown armed; `wants` becomes true once it lapses.
   */
  schedule(delay: number): void {
    this.active = false;
    this.broken = false;
    this.countdown = delay;
  }

  /**
   * Tick the respawn countdown while inactive.
   * Post: countdown decrements by `dt` only while inactive.
   */
  update(dt: number): void {
    if (!this.active && this.countdown > 0) this.countdown -= dt;
  }

  /** True when the run should place a fresh dome on the course. */
  get wants(): boolean {
    return !this.active && this.countdown <= 0;
  }
}
