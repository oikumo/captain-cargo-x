/**
 * Implements spec/enemies.md — grey jet flights.
 * SoA ring pool (same pattern as the tracer pool): preallocated, wrap-
 * overwrite spawns, straight-line kinematics, no pursuit AI (v0.0.1).
 */
export const JET_CAP = 16;
export const JET_RADIUS = 7;
export const JET_SPEED = 60; // m/s crossing the course
export const FLIGHT_SPACING_M = 45;

/**
 * Pool of grey jets (flight members).
 * Pre: one instance owned by `RunModel`; flights land here via SpawnDirector.
 * Post: ≤ JET_CAP slots; the run resolves kills/culls by flipping `alive`.
 */
export class JetPool {
  readonly length = JET_CAP;
  readonly x = new Float64Array(JET_CAP);
  readonly y = new Float64Array(JET_CAP);
  readonly z = new Float64Array(JET_CAP);
  readonly vx = new Float64Array(JET_CAP);
  readonly vy = new Float64Array(JET_CAP);
  readonly vz = new Float64Array(JET_CAP);
  readonly alive = new Uint8Array(JET_CAP);
  activeCount = 0;
  private next = 0;

  /**
   * Spawn one jet (test seam + spawn director entry).
   * Pre: position m; velocity m/s.
   * Post: slot live; ring overwrite may reclaim the oldest slot.
   */
  spawnAt(x: number, y: number, z: number, vx: number, vy: number, vz: number): void {
    const i = this.next;
    this.next = (this.next + 1) % JET_CAP;
    this.x[i] = x;
    this.y[i] = y;
    this.z[i] = z;
    this.vx[i] = vx;
    this.vy[i] = vy;
    this.vz[i] = vz;
    this.alive[i] = 1;
    this.activeCount++;
  }

  /**
   * Move live jets along their straight paths.
   * Post: positions advanced; `activeCount` reflects live slots.
   */
  update(dt: number): void {
    let count = 0;
    for (let i = 0; i < JET_CAP; i++) {
      if (this.alive[i] === 0) continue;
      this.x[i] += this.vx[i] * dt;
      this.y[i] += this.vy[i] * dt;
      this.z[i] += this.vz[i] * dt;
      count++;
    }
    this.activeCount = count;
  }

  /** Mark slot dead (rammed / shot); `activeCount` refreshes on next update. */
  kill(i: number): void {
    this.alive[i] = 0;
    if (this.activeCount > 0) this.activeCount--;
  }
}
