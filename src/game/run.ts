/**
 * Implements the run-level model: pools + player + spawner + lock-on + dome
 * + scoring + lives, orchestrating one score-attack run (GDD §2 core loop).
 * Model layer — no three/DOM/wall clock; RNG always seeded (methodology
 * §16 #8). Tests: tests/game/run.test.ts (oracles: player/enemies/objectives/
 * scoring specs).
 */
import type { BoomEvent, RunSink } from './events';
import { PlayerShip } from './player';
import { Scoring } from './scoring';
import { DronePool, DRONE_RADIUS } from './enemy-drone';
import { JetPool, JET_RADIUS } from './enemy-jet';
import { ShellPool, SHELL_RADIUS } from './shells';
import { LockonDirector } from './lockon';
import { SpawnDirector } from './spawner';
import {
  DomeObjective,
  DOME_RADIUS,
  DOMED_ALT,
  FIRST_DOME_DELAY_S,
  RESPAWN_DELAY_S,
  SHIELD_RADIUS,
} from './dome';
import { TracerPool, TRACER_RADIUS } from './tracers';
import { makeRng, RngBox } from '../utils/random';

export type RunPhase = 'idle' | 'live' | 'dead';

export interface RunOptions {
  /** Deterministic seed — same seed + same input script ⇒ same run. */
  seed?: number;
  /** Set false to mute the jet/drone/lock-on directors (dome still spawns). */
  threats?: boolean;
}

export const START_LIVES = 6;
export const SCORE_JET = 300;
export const SCORE_DRONE = 100;
export const SCORE_GUNSHIP = 300;
export const SCORE_SHIELD_HIT = 50;
export const SCORE_SHIELD_BREAK = 2500;
export const SCORE_DOME_DESTROY = 5000;
export const DOME_SPAWN_AHEAD_M = 1500;
export const DOME_SPAWN_LATERAL_M = 120;

type RectTarget = {
  x: Float64Array;
  y: Float64Array;
  z: Float64Array;
};

/**
 * One run lifecycle: `start()` → live (pools spawn, player flies, collisions
 * award) → 0 lives → 'dead' (sink gameOver) → `start()` resets everything.
 *
 * Pre: constructed once per app boot; `update()` advances only while 'live'.
 * Post: deterministic (seeded RNG + injected dt); pools preallocated —
 *       zero per-frame allocation (methodology §4).
 */
export class RunModel {
  state: RunPhase = 'idle';
  simTime = 0;
  lives = START_LIVES;
  /** Controller-written control state: steer ∈ [−1,1] (+ = left), climb, fire. */
  readonly input = { steer: 0, climb: 0, fire: false };
  readonly scoring = new Scoring();
  readonly player: PlayerShip;
  readonly tracers = new TracerPool();
  readonly jets = new JetPool();
  readonly drones = new DronePool();
  readonly shells = new ShellPool();
  readonly dome = new DomeObjective();
  readonly lockon: LockonDirector;
  readonly director: SpawnDirector;

  private readonly sink: RunSink;
  private readonly box: RngBox;
  private readonly threats: boolean;

  constructor(sink: RunSink, opts: RunOptions = {}) {
    this.sink = sink;
    this.box = new RngBox(makeRng(opts.seed ?? 1337));
    this.player = new PlayerShip(() => this.box.rng());
    this.threats = opts.threats ?? true;
    this.lockon = new LockonDirector(this.box, this.shells);
    this.director = new SpawnDirector(this.box);
  }

  /**
   * (Re)start a full run.
   * Pre: any state; an explicit seed pins a fresh deterministic stream.
   * Post: 'live'; score/lives/pools/timers/dome reset; sink notified of the
   *       initial score + lives so the HUD repaints a fresh run.
   */
  start(seed?: number): void {
    this.box.rng = makeRng(seed ?? 1337);
    this.state = 'live';
    this.simTime = 0;
    this.lives = START_LIVES;
    this.scoring.reset();
    this.player.reset(0, 40, 0, 0);
    this.tracers.alive.fill(0);
    this.jets.alive.fill(0);
    this.drones.alive.fill(0);
    this.shells.alive.fill(0);
    this.tracers.activeCount = 0;
    this.jets.activeCount = 0;
    this.drones.activeCount = 0;
    this.shells.activeCount = 0;
    this.lockon.phase = 'idle';
    this.lockon.firedCount = 0;
    this.director.reset();
    this.dome.schedule(FIRST_DOME_DELAY_S);
    this.input.steer = 0;
    this.input.climb = 0;
    this.input.fire = false;
    this.sink.onScore?.(0);
    this.sink.onLives?.(START_LIVES);
  }

  /**
   * Advance the simulation one frame.
   * Pre:  `dt` > 0 clamped seconds (injected clock — never wall time).
   * Post: while live: input → player; pools tick; directors spawn; dome
   *       lifecycle; culls; tracer sweep; player-contact sweep; 0 lives ⇒
   *       'dead' + exactly one gameOver event.
   * Exc:  no-op in 'idle'/'dead' — the sim freezes (pause screens too).
   */
  update(dt: number): void {
    if (this.state !== 'live') return;
    this.simTime += dt;

    this.player.update(dt, this.input.steer, this.input.climb, this.input.fire, this.tracers);
    this.tracers.update(dt);
    this.jets.update(dt);
    this.drones.update(dt);
    this.shells.update(dt);

    const px = this.player.x;
    const pz = this.player.z;
    const yaw = this.player.yaw;
    const fX = -Math.sin(yaw);
    const fZ = -Math.cos(yaw);
    const rX = Math.cos(yaw);
    const rZ = -Math.sin(yaw);

    if (this.threats) {
      this.director.update(dt, px, this.player.y, pz, yaw, this.jets, this.drones);
      this.lockon.update(dt, px, this.player.y, pz, yaw);
    }
    this.dome.update(dt);
    if (this.dome.wants) {
      const lat = (this.box.rng() * 2 - 1) * DOME_SPAWN_LATERAL_M;
      this.dome.spawnAt(
        px + fX * DOME_SPAWN_AHEAD_M + rX * lat,
        DOMED_ALT,
        pz + fZ * DOME_SPAWN_AHEAD_M + rZ * lat,
      );
    }

    this.cullTargets(fX, fZ, rX, rZ);
    this.tracerHits();
    this.playerCollisions();
  }

  /** Despawn: targets > 3200 m behind or |lateral| > 1200 m; dome fly-past. */
  private cullTargets(fX: number, fZ: number, rX: number, rZ: number): void {
    const px = this.player.x;
    const pz = this.player.z;
    this.cullPool(this.jets, px, pz, fX, fZ, rX, rZ);
    this.cullPool(this.drones, px, pz, fX, fZ, rX, rZ);
    if (this.dome.active) {
      const dx = this.dome.x - px;
      const dz = this.dome.z - pz;
      const dot = dx * fX + dz * fZ; // + ahead, − behind
      if (-dot > 200) this.dome.schedule(RESPAWN_DELAY_S); // flown past, no score
    }
  }

  private cullPool(
    pool: { x: Float64Array; z: Float64Array; alive: Uint8Array; kill(i: number): void },
    px: number,
    pz: number,
    fX: number,
    fZ: number,
    rX: number,
    rZ: number,
  ): void {
    for (let i = 0; i < pool.alive.length; i++) {
      if (pool.alive[i] === 0) continue;
      const dx = pool.x[i] - px;
      const dz = pool.z[i] - pz;
      const dot = dx * fX + dz * fZ;
      const lat = dx * rX + dz * rZ;
      if (-dot > 3200 || Math.abs(lat) > 1200) pool.kill(i);
    }
  }

  /**
   * Tracer → target sphere sweep: jets, drones, the lock-on gunship, then
   * the dome chain (shield first, dome only after the break).
   * Post: every hit consumes the tracer; scoring + FX route via the sink.
   */
  private tracerHits(): void {
    const tr = this.tracers;
    for (let ti = 0; ti < tr.length; ti++) {
      if (tr.alive[ti] === 0) continue;
      let consumed = false;

      for (let ji = 0; ji < this.jets.length && !consumed; ji++) {
        if (this.jets.alive[ji] === 0) continue;
        if (this.tracerSq(tr, ti, this.jets, ji) < (JET_RADIUS + TRACER_RADIUS) ** 2) {
          this.jets.kill(ji);
          this.awardKill(SCORE_JET, tr.x[ti], tr.y[ti], tr.z[ti], 'jet');
          consumed = true;
        }
      }
      for (let di = 0; di < this.drones.length && !consumed; di++) {
        if (this.drones.alive[di] === 0) continue;
        if (this.tracerSq(tr, ti, this.drones, di) < (DRONE_RADIUS + TRACER_RADIUS) ** 2) {
          this.drones.kill(di);
          this.awardKill(SCORE_DRONE, tr.x[ti], tr.y[ti], tr.z[ti], 'drone');
          consumed = true;
        }
      }
      const lk = this.lockon;
      if (!consumed && lk.active) {
        const gdx = tr.x[ti] - lk.x;
        const gdy = tr.y[ti] - lk.y;
        const gdz = tr.z[ti] - lk.z;
        if (gdx * gdx + gdy * gdy + gdz * gdz < (JET_RADIUS + TRACER_RADIUS) ** 2) {
          if (lk.hit()) this.awardKill(SCORE_GUNSHIP, lk.x, lk.y, lk.z, 'gunship');
          else this.sink.onBoom?.({ x: lk.x, y: lk.y, z: lk.z, kind: 'shield-hit' });
          consumed = true;
        }
      }
      const dome = this.dome;
      if (!consumed && dome.active) {
        const ddx = dome.x - tr.x[ti];
        const ddy = dome.y - tr.y[ti];
        const ddz = dome.z - tr.z[ti];
        const dsq = ddx * ddx + ddy * ddy + ddz * ddz;
        if (!dome.broken && dsq < SHIELD_RADIUS * SHIELD_RADIUS) {
          dome.shieldHp--;
          this.scoring.addShieldHit(SCORE_SHIELD_HIT);
          this.sink.onScore?.(this.scoring.score);
          this.sink.onBoom?.({ x: tr.x[ti], y: tr.y[ti], z: tr.z[ti], kind: 'shield-hit' });
          if (dome.shieldHp <= 0) {
            dome.broken = true;
            this.scoring.addFlat(SCORE_SHIELD_BREAK);
            this.sink.onScore?.(this.scoring.score);
            this.sink.onBoom?.({ x: dome.x, y: dome.y, z: dome.z, kind: 'shield-break' });
          }
          consumed = true;
        } else if (dome.broken && dsq < DOME_RADIUS * DOME_RADIUS) {
          dome.domeHp--;
          if (dome.domeHp <= 0) {
            dome.schedule(RESPAWN_DELAY_S);
            this.scoring.addFlat(SCORE_DOME_DESTROY);
            this.sink.onScore?.(this.scoring.score);
            this.sink.onBoom?.({ x: dome.x, y: dome.y, z: dome.z, kind: 'dome-destroy' });
          } else {
            this.sink.onBoom?.({ x: tr.x[ti], y: tr.y[ti], z: tr.z[ti], kind: 'shield-hit' });
          }
          consumed = true;
        }
      }
      if (consumed) tr.kill(ti);
    }
  }

  private tracerSq(tr: TracerPool, ti: number, pool: RectTarget, oi: number): number {
    const dx = tr.x[ti] - pool.x[oi];
    const dy = tr.y[ti] - pool.y[oi];
    const dz = tr.z[ti] - pool.z[oi];
    return dx * dx + dy * dy + dz * dz;
  }

  /**
   * Player-contact sweep: rammed jets/drones + contacting/expired shells.
   * Post: contacting enemies always explode (arcade truth — ramming costs
   *       the enemy); a life is lost only when the i-frame gate accepts;
   *       0 lives ⇒ 'dead' + exactly one gameOver event.
   */
  private playerCollisions(): void {
    const px = this.player.x;
    const py = this.player.y;
    const pz = this.player.z;
    for (let i = 0; i < this.jets.length; i++) {
      if (this.jets.alive[i] === 0) continue;
      if (this.touchSq(this.jets.x[i], this.jets.y[i], this.jets.z[i], px, py, pz, JET_RADIUS + 6)) {
        this.jets.kill(i);
        this.notify('jet', this.jets.x[i], this.jets.y[i], this.jets.z[i]);
        this.damagePlayer();
      }
    }
    for (let i = 0; i < this.drones.length; i++) {
      if (this.drones.alive[i] === 0) continue;
      if (this.touchSq(this.drones.x[i], this.drones.y[i], this.drones.z[i], px, py, pz, DRONE_RADIUS + 6)) {
        this.drones.kill(i);
        this.notify('drone', this.drones.x[i], this.drones.y[i], this.drones.z[i]);
        this.damagePlayer();
      }
    }
    for (let i = 0; i < this.shells.length; i++) {
      if (this.shells.alive[i] === 0) continue;
      if (this.touchSq(this.shells.x[i], this.shells.y[i], this.shells.z[i], px, py, pz, SHELL_RADIUS + 6)) {
        this.shells.kill(i);
        this.notify('shell', this.shells.x[i], this.shells.y[i], this.shells.z[i]);
        this.damagePlayer();
      } else if (this.shells.y[i] <= 2) {
        this.shells.kill(i);
        this.notify('splash', this.shells.x[i], 0, this.shells.z[i]);
      }
    }
  }

  private touchSq(
    x: number,
    y: number,
    z: number,
    px: number,
    py: number,
    pz: number,
    reach: number,
  ): boolean {
    const dx = x - px;
    const dy = y - py;
    const dz = z - pz;
    return dx * dx + dy * dy + dz * dz < reach * reach;
  }

  /** Accepted damage ⇒ 1 life; the gate in player.ts arms i-frames itself. */
  private damagePlayer(): void {
    if (!this.player.tryHit()) return;
    this.lives--;
    this.sink.onLives?.(this.lives);
    if (this.lives <= 0) {
      this.state = 'dead';
      this.sink.onGameOver?.();
    }
  }

  private awardKill(base: number, x: number, y: number, z: number, kind: BoomEvent['kind']): void {
    this.scoring.addKill(this.simTime, base);
    this.sink.onScore?.(this.scoring.score);
    this.notify(kind, x, y, z);
  }

  private notify(kind: BoomEvent['kind'], x: number, y: number, z: number): void {
    this.sink.onBoom?.({ x, y, z, kind });
  }
}
