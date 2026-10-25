/**
 * Implements spec/enemies.md — lock-on gunship event: one at a time; drifts
 * far ahead, telegraphs with green converging beams (view polls the phase),
 * then launches one slow dodgeable shell toward the player's lock position.
 * Killing the gunship (hp 3) cancels the shell.
 */
import { range, type Rng } from '../utils/random';
import { SHELL_SPEED, type ShellPool } from './shells';

export const LOCKON_TELEGRAPH_S = 1.5;
export const LOCKON_SPENT_S = 0.8;
export const LOCKON_GAP_MIN_S = 8;
export const LOCKON_GAP_MAX_S = 12;
export const LOCKON_ALT = 60;
export const LOCKON_RANGE_M = 1200; // spawn distance ahead
export const GUNSHIP_DRIFT = 20; // m/s lateral
export const GUNSHIP_HP = 3;

export type LockonPhase = 'idle' | 'telegraph' | 'spent';

/**
 * Lock-on event owner (one event max at a time, spec row).
 * Pre: one instance owned by `RunModel`; shells pool shared for launches.
 * Post: lifecycle `idle → telegraph (beams) → spent (gunship lingers) →
 *       idle`; `firedCount` counts launched shells across the run.
 */
export class LockonDirector {
  phase: LockonPhase = 'idle';
  x = 0;
  y = LOCKON_ALT;
  z = 0;
  hp = GUNSHIP_HP;
  firedCount = 0;
  private timerS = 0;
  private gapS = 0;
  private drift = 0;

  constructor(private readonly box: { rng: Rng }, private readonly shells: ShellPool) {}

  /**
   * Force-start a telegraph (spawn-director path; also the deterministic
   * test seam). `vx` = lateral drift m/s (director passes a random slide,
   * tests pass 0).
   * Post: phase 'telegraph', gunship hp restored, timer armed.
   */
  spawnAt(x: number, y: number, z: number, vx = 0): void {
    this.x = x;
    this.y = y;
    this.z = z;
    this.drift = vx;
    this.hp = GUNSHIP_HP;
    this.timerS = LOCKON_TELEGRAPH_S;
    this.phase = 'telegraph';
  }

  /**
   * Advance the event machine.
   * Pre:  player world position + yaw; `dt` > 0.
   * Post: idle counts down the 8–12 s gap then telegraphs; telegraph drifts
   *       laterally and fires one 45 m/s shell at the player's position when
   *       the timer lapses; spent decays back to idle with a fresh gap.
   */
  update(dt: number, px: number, py: number, pz: number, yaw: number): void {
    switch (this.phase) {
      case 'idle': {
        this.gapS -= dt;
        if (this.gapS <= 0) {
          const fx = -Math.sin(yaw);
          const fz = -Math.cos(yaw);
          this.gapS = range(this.box.rng, LOCKON_GAP_MIN_S, LOCKON_GAP_MAX_S);
          this.spawnAt(
            px + fx * LOCKON_RANGE_M,
            LOCKON_ALT,
            pz + fz * LOCKON_RANGE_M,
            range(this.box.rng, -GUNSHIP_DRIFT, GUNSHIP_DRIFT),
          );
        }
        break;
      }
      case 'telegraph': {
        this.x += this.drift * dt;
        this.timerS -= dt;
        if (this.timerS <= 0) {
          const dx = px - this.x;
          const dy = py - this.y;
          const dz = pz - this.z;
          const len = Math.hypot(dx, dy, dz) || 1;
          const s = SHELL_SPEED / len;
          this.shells.spawn(this.x, this.y, this.z, dx * s, dy * s, dz * s);
          this.firedCount++;
          this.phase = 'spent';
          this.timerS = LOCKON_SPENT_S;
        }
        break;
      }
      case 'spent': {
        this.timerS -= dt;
        if (this.timerS <= 0) {
          this.phase = 'idle';
          this.gapS = range(this.box.rng, LOCKON_GAP_MIN_S, LOCKON_GAP_MAX_S);
        }
        break;
      }
    }
  }

  /**
   * Apply one hit; killing closes the event (no shell).
   * Post: true ⇒ hp exhausted — gunship destroyed; phase back to idle with
   *       a fresh gap (run routes the boom + score).
   */
  hit(): boolean {
    this.hp--;
    if (this.hp > 0) return false;
    this.phase = 'idle';
    this.gapS = range(this.box.rng, LOCKON_GAP_MIN_S, LOCKON_GAP_MAX_S);
    return true;
  }

  /** Gunship is on the field (killable by tracers). */
  get active(): boolean {
    return this.phase !== 'idle';
  }

  /** Telegraph fraction 1 → 0 (beams converge); 0 outside telegraph. */
  get telegraphProgress(): number {
    return this.phase === 'telegraph'
      ? Math.max(0, this.timerS / LOCKON_TELEGRAPH_S)
      : 0;
  }
}
