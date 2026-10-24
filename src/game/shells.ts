/**
 * Implements spec/enemies.md — enemy shells: slow, dodgeable, straight
 * unaimed shots launched after the lock-on telegraph. SoA ring pool.
 */
export const SHELL_CAP = 6;
export const SHELL_RADIUS = 5;
export const SHELL_SPEED = 45; // m/s
export const SHELL_LIFE_S = 6;

/**
 * Pool of enemy shells.
 * Pre: one instance owned by `RunModel` (the lock-on director launches).
 * Post: ≤ SHELL_CAP slots; water contact is resolved by the run (splash).
 */
export class ShellPool {
  readonly length = SHELL_CAP;
  readonly x = new Float64Array(SHELL_CAP);
  readonly y = new Float64Array(SHELL_CAP);
  readonly z = new Float64Array(SHELL_CAP);
  readonly vx = new Float64Array(SHELL_CAP);
  readonly vy = new Float64Array(SHELL_CAP);
  readonly vz = new Float64Array(SHELL_CAP);
  readonly life = new Float64Array(SHELL_CAP);
  readonly alive = new Uint8Array(SHELL_CAP);
  activeCount = 0;
  private next = 0;

  /**
   * Spawn one shell (already normalized velocity at m/s).
   * Pre: dir components form any vector — the caller normalizes.
   * Post: slot live with `SHELL_LIFE_S` left.
   */
  spawn(x: number, y: number, z: number, vx: number, vy: number, vz: number): void {
    const i = this.next;
    this.next = (this.next + 1) % SHELL_CAP;
    this.x[i] = x;
    this.y[i] = y;
    this.z[i] = z;
    this.vx[i] = vx;
    this.vy[i] = vy;
    this.vz[i] = vz;
    this.life[i] = SHELL_LIFE_S;
    this.alive[i] = 1;
  }

  /**
   * Move live shells; expire on lifetime only (water contact → run splash).
   * Post: expired slots marked dead; `activeCount` reflects survivors.
   */
  update(dt: number): void {
    let count = 0;
    for (let i = 0; i < SHELL_CAP; i++) {
      if (this.alive[i] === 0) continue;
      this.x[i] += this.vx[i] * dt;
      this.y[i] += this.vy[i] * dt;
      this.z[i] += this.vz[i] * dt;
      this.life[i] -= dt;
      if (this.life[i] <= 0) {
        this.alive[i] = 0;
        continue;
      }
      count++;
    }
    this.activeCount = count;
  }

  /** Mark slot dead (hit stack by `RunModel`). */
  kill(i: number): void {
    this.alive[i] = 0;
    if (this.activeCount > 0) this.activeCount--;
  }
}
