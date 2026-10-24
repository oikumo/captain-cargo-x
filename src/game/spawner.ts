/**
 * Implements spec/enemies.md — spawn director (model design per methodology
 * §8: timed/random patterns of actors are model work, never views).
 * v0.0.1 cadences: jet flight 3–5 s, drone 6–9 s; no difficulty scaling.
 */
import { range, type Rng } from '../utils/random';
import { DRONE_ALT, DRONE_CAP, DRONE_SPEED, type DronePool } from './enemy-drone';
import { FLIGHT_SPACING_M, JET_CAP, JET_SPEED, type JetPool } from './enemy-jet';

export const JET_GAP_MIN_S = 3;
export const JET_GAP_MAX_S = 5;
export const DRONE_GAP_MIN_S = 6;
export const DRONE_GAP_MAX_S = 9;
export const FLIGHT_MIN = 3;
export const FLIGHT_MAX = 6;
export const FLIGHT_AHEAD_M = 1100; // course point the flight crosses
export const FLIGHT_OFFSET_M = 400; // lateral start offset from that point

/**
 * Jet flights + solo drones spawner.
 * Pre: one instance owned by `RunModel`; streams pulled from the run's
 *      seed via the RngBox (reseeded per run start).
 * Post: at most one spawn action per `update()` call; timers re-roll from
 *       the seeded stream deterministically.
 */
export class SpawnDirector {
  private jetTimerS = 0;
  private droneTimerS = 0;

  constructor(private readonly box: { rng: Rng }) {}

  /**
   * Arm gap timers for a fresh run.
   * Post: first jet flight due in 3–5 s, first drone in 6–9 s.
   */
  reset(): void {
    this.jetTimerS = range(this.box.rng, JET_GAP_MIN_S, JET_GAP_MAX_S);
    this.droneTimerS = range(this.box.rng, DRONE_GAP_MIN_S, DRONE_GAP_MAX_S);
  }

  /**
   * Tick spawn cadence and fill pools.
   * Pre: player world position + yaw; pools of the current run.
   * Post: one flight/drone spawned max per call; timer re-rolls after each.
   */
  update(dt: number, px: number, py: number, pz: number, yaw: number, jets: JetPool, drones: DronePool): void {
    this.jetTimerS -= dt;
    if (this.jetTimerS <= 0) {
      this.jetTimerS = range(this.box.rng, JET_GAP_MIN_S, JET_GAP_MAX_S);
      this.spawnFlight(px, py, pz, yaw, jets);
    }
    this.droneTimerS -= dt;
    if (this.droneTimerS <= 0) {
      this.droneTimerS = range(this.box.rng, DRONE_GAP_MIN_S, DRONE_GAP_MAX_S);
      this.spawnDrone(px, pz, yaw, drones);
    }
  }

  /**
   * One crossing flight of 3–6 jets in a line, at the player's altitude,
   * aimed to cross the course slightly ahead; trailing spacing 45 m.
   * Post: ≤ FLIGHT_MAX jets live in the pool (ring cap protects the rest).
   */
  private spawnFlight(px: number, py: number, pz: number, yaw: number, jets: JetPool): void {
    if (jets.activeCount > JET_CAP - FLIGHT_MIN) return;
    const count = FLIGHT_MIN + Math.floor(this.box.rng() * (FLIGHT_MAX - FLIGHT_MIN + 1));
    const side = this.box.rng() < 0.5 ? -1 : 1;
    const fx = -Math.sin(yaw);
    const fz = -Math.cos(yaw);
    const rx = Math.cos(yaw);
    const rz = -Math.sin(yaw);
    // heading: across the course with a slight forward pull → crossing
    // flights sweep through the player's lane (arcade flyby + ram risk)
    let hx = -rx * side + fx * 0.25;
    let hz = -rz * side + fz * 0.25;
    const hlen = Math.hypot(hx, hz);
    hx = (hx / hlen) * JET_SPEED;
    hz = (hz / hlen) * JET_SPEED;
    const baseX = px + fx * FLIGHT_AHEAD_M + rx * side * FLIGHT_OFFSET_M;
    const baseZ = pz + fz * FLIGHT_AHEAD_M + rz * side * FLIGHT_OFFSET_M;
    for (let i = 0; i < count; i++) {
      jets.spawnAt(
        baseX - (hx / JET_SPEED) * FLIGHT_SPACING_M * i,
        py,
        baseZ - (hz / JET_SPEED) * FLIGHT_SPACING_M * i,
        hx,
        0,
        hz,
      );
    }
  }

  /**
   * One slow solo drone under the course line.
   * Post: ≤ DRONE_CAP drones live (ring cap guards).
   */
  private spawnDrone(px: number, pz: number, yaw: number, drones: DronePool): void {
    if (drones.activeCount >= DRONE_CAP) return;
    const side = this.box.rng() < 0.5 ? -1 : 1;
    const lateral = range(this.box.rng, 0, 600) * side;
    const fx = -Math.sin(yaw);
    const fz = -Math.cos(yaw);
    const rx = Math.cos(yaw);
    const rz = -Math.sin(yaw);
    let hx = -rx * side * 0.7 + fx * 0.5;
    let hz = -rz * side * 0.7 + fz * 0.5;
    const hlen = Math.hypot(hx, hz);
    hx = (hx / hlen) * DRONE_SPEED;
    hz = (hz / hlen) * DRONE_SPEED;
    drones.spawnAt(px + fx * 500 + rx * lateral, DRONE_ALT, pz + fz * 500 + rz * lateral, hx, 0, hz);
  }
}
