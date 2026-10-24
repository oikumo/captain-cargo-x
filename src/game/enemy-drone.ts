/**
 * Implements spec/enemies.md — twin-boom patrol drones: slow, unintelligent,
 * low altitude, solo. Same SoA ring pattern as the jet pool.
 */
export const DRONE_CAP = 4;
export const DRONE_RADIUS = 8;
export const DRONE_SPEED = 28; // m/s
export const DRONE_ALT = 14; // hugs the water, under the default course

/**
 * Pool of drones.
 * Pre: one instance owned by `RunModel`.
 * Post: ≤ DRONE_CAP slots; kill/cull by flipping `alive`.
 */
export class DronePool {
  readonly length = DRONE_CAP;
  readonly x = new Float64Array(DRONE_CAP);
  readonly y = new Float64Array(DRONE_CAP);
  readonly z = new Float64Array(DRONE_CAP);
  readonly vx = new Float64Array(DRONE_CAP);
  readonly vy = new Float64Array(DRONE_CAP);
  readonly vz = new Float64Array(DRONE_CAP);
  readonly alive = new Uint8Array(DRONE_CAP);
  activeCount = 0;
  private next = 0;

  /**
   * Spawn one drone.
   * Pre: position m; velocity m/s.
   * Post: slot live; ring overwrite on oldest slot when saturated.
   */
  spawnAt(x: number, y: number, z: number, vx: number, vy: number, vz: number): void {
    const i = this.next;
    this.next = (this.next + 1) % DRONE_CAP;
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
   * Move live drones.
   * Post: positions advanced; `activeCount` reflects live slots.
   */
  update(dt: number): void {
    let count = 0;
    for (let i = 0; i < DRONE_CAP; i++) {
      if (this.alive[i] === 0) continue;
      this.x[i] += this.vx[i] * dt;
      this.y[i] += this.vy[i] * dt;
      this.z[i] += this.vz[i] * dt;
      count++;
    }
    this.activeCount = count;
  }

  /** Mark slot dead. */
  kill(i: number): void {
    this.alive[i] = 0;
    if (this.activeCount > 0) this.activeCount--;
  }
}
