/**
 * Implements spec/player.md — hover-fighter flight, cannon, damage.
 * Model layer: no three/DOM/wall clock (methodology §5); yaw/bank/muzzle/
 * i-frames are radians/seconds at this boundary. Tests: tests/game/run.test.ts.
 * Tuning table values below are the spec's v0.0.1 proposal numbers.
 */
import { clamp, damp } from '../utils/math';
import { range, type Rng } from '../utils/random';
import type { TracerPool } from './tracers';

export const BASE_SPEED = 120; // m/s, constant while playing
export const STEER_RATE = 1.6; // rad/s
export const CLIMB_RATE = 24; // m/s
export const ALT_MIN = 10;
export const ALT_MAX = 90;
export const BANK_MAX = 0.6; // rad, visual-only roll
export const BANK_RATE = 8; // s⁻¹ smoothing toward the target bank
export const FIRE_COOLDOWN_S = 0.1;
export const MUZZLE_S = 0.06; // muzzle-flash window (view polls)
export const TRACER_SPEED = 320; // m/s
export const TRACER_SPREAD = 0.02; // rad per axis, cosmetic
export const TRACER_LIFE_S = 3.5;
export const IFRAMES_S = 1.5;

/**
 * One player ship. Positions/velocities are plain numbers — the view polls
 * and renders; nothing here touches engine or view types.
 *
 * Pre: owned by `RunModel`; one instance per run.
 * Post: kinematics are frame-mode normalized — stepping in tiny slices
 *       approximates the continuous curve (clamp/damp are dt-aware).
 */
export class PlayerShip {
  x = 0;
  y = 40;
  z = 0;
  yaw = 0;
  bank = 0;
  /** Tunable for calibrations/tests; spec/player.md proposal = 120. */
  speed = BASE_SPEED;
  muzzleS = 0;
  invulnS = 0;
  private cooldownS = 0;

  constructor(private readonly rng: Rng) {}

  /**
   * Full wipe to a known kinematic state (boot, restart, and the test
   * seam that re-arms scenarios deterministically).
   * Post: cooldowns, muzzle, i-frames and bank cleared; speed re-armed.
   */
  reset(x: number, y: number, z: number, yaw = 0): void {
    this.x = x;
    this.y = y;
    this.z = z;
    this.yaw = yaw;
    this.bank = 0;
    this.speed = BASE_SPEED;
    this.muzzleS = 0;
    this.invulnS = 0;
    this.cooldownS = 0;
  }

  /**
   * Step kinematics + fire intent.
   * Pre:  `dt` > 0 seconds; steer/climb ∈ [−1, 1]; `tracers` is the pool.
   * Post: auto-forward (yaw-dependent forward vector) at `speed`; altitude
   *       clamped to the band; bank smoothed toward steer; fire spawns a
   *       tracer at cooldown cadence when held.
   * Spec: spec/player.md flight + cannon rows.
   */
  update(dt: number, steer: number, climb: number, fireHeld: boolean, tracers: TracerPool): void {
    this.yaw += STEER_RATE * steer * dt;
    const fx = -Math.sin(this.yaw);
    const fz = -Math.cos(this.yaw);
    this.x += fx * this.speed * dt;
    this.z += fz * this.speed * dt;
    this.y = clamp(this.y + CLIMB_RATE * climb * dt, ALT_MIN, ALT_MAX);
    this.bank = damp(this.bank, BANK_MAX * steer, BANK_RATE, dt);

    this.cooldownS -= dt;
    if (this.muzzleS > 0) this.muzzleS = Math.max(0, this.muzzleS - dt);
    if (this.invulnS > 0) this.invulnS = Math.max(0, this.invulnS - dt);

    if (fireHeld && this.cooldownS <= 0) {
      this.cooldownS = FIRE_COOLDOWN_S;
      this.muzzleS = MUZZLE_S;
      const rx = Math.cos(this.yaw);
      const rz = -Math.sin(this.yaw);
      const sx = range(this.rng, -TRACER_SPREAD, TRACER_SPREAD) * TRACER_SPEED;
      const sy = range(this.rng, -TRACER_SPREAD, TRACER_SPREAD) * TRACER_SPEED;
      tracers.spawn(this.x + fx * 4, this.y, this.z + fz * 4, fx * TRACER_SPEED + rx * sx, sy, fz * TRACER_SPEED + rz * sx);
    }
  }

  /**
   * I-frame gate for every accepted damage moment (ram, shell).
   * Pre:  run is live; called at most once per contact event.
   * Exc:  returns `false` inside the i-frame window — nothing else changes.
   * Post: `true` ⇒ a life is lost (caller decrements); 1.5 s i-frames armed.
   */
  tryHit(): boolean {
    if (this.invulnS > 0) return false;
    this.invulnS = IFRAMES_S;
    return true;
  }
}
