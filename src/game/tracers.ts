/**
 * Implements spec/player.md cannon rows — player tracer pool.
 * Structure-of-arrays ring buffer: preallocated once, zero hot-path
 * allocation (methodology §4 frame budget); oldest shot overwrites first
 * so a sustained stream never fails to spawn.
 */
import { TRACER_LIFE_S } from './player';

export const TRACER_CAP = 64;
/** Kill radius adds to the target's own radius (enemies.md hit volumes). */
export const TRACER_RADIUS = 2;

/**
 * Pool of player tracers.
 * Pre: one instance owned by `RunModel`.
 * Post: `length` slots fixed; ring order wraps; `activeCount` counts live
 *       slots after each `update()`.
 */
export class TracerPool {
  readonly length = TRACER_CAP;
  readonly x = new Float64Array(TRACER_CAP);
  readonly y = new Float64Array(TRACER_CAP);
  readonly z = new Float64Array(TRACER_CAP);
  readonly vx = new Float64Array(TRACER_CAP);
  readonly vy = new Float64Array(TRACER_CAP);
  readonly vz = new Float64Array(TRACER_CAP);
  readonly life = new Float64Array(TRACER_CAP);
  readonly alive = new Uint8Array(TRACER_CAP);
  activeCount = 0;
  private next = 0;

  /**
   * Spawn one tracer at the ring cursor, overwriting the oldest slot.
   * Pre:  position in meters starting at the nose; velocity m/s.
   * Post: slot live with `TRACER_LIFE_S` left; overwrite may reclaim an
   *       older live slot under saturation (by design, no spawn failure).
   */
  spawn(x: number, y: number, z: number, vx: number, vy: number, vz: number): void {
    const i = this.next;
    this.next = (this.next + 1) % TRACER_CAP;
    this.x[i] = x;
    this.y[i] = y;
    this.z[i] = z;
    this.vx[i] = vx;
    this.vy[i] = vy;
    this.vz[i] = vz;
    this.life[i] = TRACER_LIFE_S;
    this.alive[i] = 1;
  }

  /**
   * Advance all live tracers; expire on lifetime or water contact (y ≤ 1.5).
   * Post: expired/water slots marked dead; `activeCount` reflects survivors.
   */
  update(dt: number): void {
    let count = 0;
    for (let i = 0; i < TRACER_CAP; i++) {
      if (this.alive[i] === 0) continue;
      this.x[i] += this.vx[i] * dt;
      this.y[i] += this.vy[i] * dt;
      this.z[i] += this.vz[i] * dt;
      this.life[i] -= dt;
      if (this.life[i] <= 0 || this.y[i] <= 1.5) {
        this.alive[i] = 0;
        continue;
      }
      count++;
    }
    this.activeCount = count;
  }

  /** Mark slot dead (hit resolution by `RunModel`); next `update()` recounts. */
  kill(i: number): void {
    this.alive[i] = 0;
    if (this.activeCount > 0) this.activeCount--;
  }
}
