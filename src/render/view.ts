/**
 * Implements spec/asset-pipeline.md (placeholder-driven rendering) — the
 * three.js view: scene, camera chase, pooled entity meshes cloned from
 * registry templates, FX wiring. Pure poller: reads run state every frame
 * and reacts to bus booms; never mutates the model (methodology §5).
 * Body pointers: spec/player.md (bank/muzzle/i-frames) · spec/enemies.md
 * (pools/cadence) · spec/objectives.md (pulse/break visuals).
 */
import * as THREE from 'three';
import type { EventBus } from '../core/bus';
import type { GameEvents } from '../core/run-controller';
import type { RunModel } from '../game/run';
import type { BoomEvent } from '../game/events';
import { MUZZLE_S } from '../game/player';
import { JET_CAP } from '../game/enemy-jet';
import { DRONE_CAP } from '../game/enemy-drone';
import { SHELL_CAP } from '../game/shells';
import { TRACER_CAP } from '../game/tracers';
import type { ModelKey } from '../loaders/registry';
import { applySky } from '../world/sky';
import { Ocean } from '../world/ocean';
import { Bursts, BURST_SPECS } from '../fx/bursts';
import { Blasts } from '../fx/blast';
import { LockonBeams } from '../fx/beams';
import { damp } from '../utils/math';

type Templates = Map<ModelKey, THREE.Object3D>;

function firstMesh(root: THREE.Object3D): THREE.Mesh | null {
  let found: THREE.Mesh | null = null;
  root.traverse((o) => {
    if (!found && (o as THREE.Mesh).isMesh) found = o as THREE.Mesh;
  });
  return found;
}

function collectNamed(root: THREE.Object3D, name: string): THREE.Object3D[] {
  const out: THREE.Object3D[] = [];
  root.traverse((o) => {
    if (o.name === name) out.push(o);
  });
  return out;
}

/**
 * The game view — one instance per boot.
 * Pre: renderer + run + bus injected; templates resolved (loadAll).
 * Post: `update(dt)` syncs every pooled mesh from the model (visible only
 *       for live slots), animates FX, drives the chase camera; `render()`
 *       draws one frame. Zero allocation after construction.
 */
export class GameView {
  private readonly scene = new THREE.Scene();
  private readonly camera = new THREE.PerspectiveCamera(62, 1, 0.5, 5000);
  private readonly renderer: THREE.WebGLRenderer;
  private readonly run: RunModel;
  private readonly ocean = new Ocean();
  private readonly bursts = new Bursts();
  private readonly blasts = new Blasts();
  private readonly beams = new LockonBeams();
  private readonly player: THREE.Object3D;
  private readonly engines: THREE.Object3D[];
  private readonly jets: THREE.Object3D[];
  private readonly drones: THREE.Object3D[];
  private readonly droneRotors: THREE.Object3D[][];
  private readonly tracers: THREE.Object3D[];
  private readonly shells: THREE.Object3D[];
  private readonly gunship: THREE.Object3D;
  private readonly dome: THREE.Object3D;
  private readonly shield: THREE.Object3D;
  private readonly shieldMat: THREE.MeshBasicMaterial;
  private readonly crates: THREE.Object3D[];
  private readonly muzzle: THREE.Mesh;
  private readonly camPos = new THREE.Vector3(0, 52, 30);
  private readonly lookAt = new THREE.Vector3();

  private readonly onBoom = (e: BoomEvent): void => {
    const spec = BURST_SPECS[e.kind];
    this.bursts.spawn(e.x, e.y, e.z, spec);
    if (e.kind === 'shield-break') this.blasts.spawn(e.x, e.y, e.z, 30, 0xff8fc0);
    if (e.kind === 'dome-destroy') this.blasts.spawn(e.x, e.y, e.z, 40, 0xffb37a);
  };

  constructor(renderer: THREE.WebGLRenderer, run: RunModel, bus: EventBus<GameEvents>, templates: Templates) {
    this.renderer = renderer;
    this.run = run;
    applySky(this.scene);
    this.scene.add(this.ocean.mesh, this.bursts.points, this.blasts.group, this.beams.group);

    this.player = templates.get('player')!.clone();
    this.player.rotation.order = 'YXZ';
    this.engines = collectNamed(this.player, 'engine');
    this.scene.add(this.player);

    this.jets = this.clonePool(templates, 'enemy-jet', JET_CAP);
    this.drones = this.clonePool(templates, 'enemy-drone', DRONE_CAP);
    this.droneRotors = this.drones.map((d) => collectNamed(d, 'rotor'));
    this.tracers = this.clonePool(templates, 'tracer', TRACER_CAP);
    this.shells = this.clonePool(templates, 'shell', SHELL_CAP);
    this.gunship = templates.get('gunship')!.clone();
    this.scene.add(this.gunship);

    this.dome = templates.get('objective-dome')!.clone();
    this.shield = templates.get('objective-shield')!.clone();
    this.crates = this.clonePool(templates, 'crate', 4);
    this.scene.add(this.dome, this.shield, ...this.crates);
    this.shieldMat = firstMesh(this.shield)!.material as THREE.MeshBasicMaterial;
    this.shieldMat.transparent = true;

    this.muzzle = new THREE.Mesh(
      new THREE.SphereGeometry(0.9, 8, 6),
      new THREE.MeshBasicMaterial({ color: 0xffc46b, transparent: true, opacity: 0.9 }),
    );
    this.muzzle.visible = false;
    this.scene.add(this.muzzle);

    bus.on('boom', this.onBoom);
  }

  private clonePool(templates: Templates, key: ModelKey, count: number): THREE.Object3D[] {
    const template = templates.get(key)!;
    const pool: THREE.Object3D[] = [];
    for (let i = 0; i < count; i++) {
      const clone = template.clone();
      clone.visible = false;
      this.scene.add(clone);
      pool.push(clone);
    }
    return pool;
  }

  /** Match the drawing area (window resize). */
  resize(width: number, height: number): void {
    this.renderer.setSize(width, height);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }

  /**
   * Sync visuals from the model + advance FX and camera.
   * Pre: `dt` clamped frame seconds; called once per frame while the app
   *      runs (all states — menus show the frozen world).
   * Post: every pooled mesh mirrors its model slot (position, heading,
   *       visibility); ocean waves, shield pulse, crate orbit, beams,
   *       muzzle/i-frame feedback, chase camera all advanced.
   */
  update(dt: number): void {
    const run = this.run;
    const t = run.simTime;
    const p = run.player;
    const fx = -Math.sin(p.yaw);
    const fz = -Math.cos(p.yaw);

    // player + cosmetics
    this.player.position.set(p.x, p.y, p.z);
    this.player.rotation.set(0, p.yaw, p.bank);
    this.player.visible = p.invulnS <= 0 || Math.floor(t * 12) % 2 === 0;
    const enginePulse = 1 + 0.25 * Math.sin(t * 22);
    for (const e of this.engines) e.scale.setScalar(enginePulse);
    this.muzzle.visible = p.muzzleS > 0;
    if (p.muzzleS > 0) {
      this.muzzle.position.set(p.x + fx * 4.4, p.y + 0.2, p.z + fz * 4.4);
      this.muzzle.scale.setScalar(0.6 + (p.muzzleS / MUZZLE_S) * 0.9);
    }

    this.syncPools(run, dt);

    // dome objective visuals (spec/objectives.md feedback rows)
    const dome = run.dome;
    const domeActive = dome.active;
    this.dome.visible = domeActive;
    this.shield.visible = domeActive && !dome.broken;
    this.dome.position.set(dome.x, dome.y, dome.z);
    this.shield.position.set(dome.x, dome.y, dome.z);
    if (this.shield.visible) {
      this.shieldMat.opacity = 0.27 + 0.08 * Math.sin(t * Math.PI * 2 * 6); // ~6 Hz pulse
    }
    for (let i = 0; i < this.crates.length; i++) {
      const crate = this.crates[i];
      crate.visible = domeActive;
      if (!domeActive) continue;
      const a = t * 0.8 + (i * Math.PI) / 2;
      crate.position.set(
        dome.x + Math.cos(a) * 16,
        dome.y + Math.sin(t * 1.2 + i * 1.7) * 1.8 - 2,
        dome.z + Math.sin(a) * 16,
      );
      crate.rotation.set(a * 0.5, a, 0);
    }

    // lock-on gunship + telegraph beams
    const lk = run.lockon;
    this.gunship.visible = lk.active;
    if (lk.active) {
      this.gunship.position.set(lk.x, lk.y, lk.z);
      this.gunship.rotation.y = Math.atan2(-(p.x - lk.x), -(p.z - lk.z));
    }
    this.beams.update(lk.phase === 'telegraph', lk.x, lk.y + 1, lk.z, p.x, p.y, p.z, t);

    // world + fx
    this.ocean.update(t, p.x, p.z);
    this.bursts.update(dt);
    this.blasts.update(dt);

    // chase camera: damp behind the ship, slight bank roll for arcade feel
    const camX = p.x + Math.sin(p.yaw) * 26;
    const camY = p.y + 11;
    const camZ = p.z + Math.cos(p.yaw) * 26;
    this.camPos.x = damp(this.camPos.x, camX, 6, dt);
    this.camPos.y = damp(this.camPos.y, camY, 6, dt);
    this.camPos.z = damp(this.camPos.z, camZ, 6, dt);
    this.camera.position.copy(this.camPos);
    this.lookAt.set(p.x + fx * 24, p.y + 2, p.z + fz * 24);
    this.camera.lookAt(this.lookAt);
    this.camera.rotateZ(-p.bank * 0.22);
  }

  /** Mirror every pool: visibility, position, heading; spin drone rotors. */
  private syncPools(run: RunModel, dt: number): void {
    const { tracers, jets, drones, shells } = run;
    for (let i = 0; i < TRACER_CAP; i++) {
      const mesh = this.tracers[i];
      mesh.visible = tracers.alive[i] === 1;
      if (!mesh.visible) continue;
      mesh.position.set(tracers.x[i], tracers.y[i], tracers.z[i]);
      mesh.rotation.y = Math.atan2(-tracers.vx[i], -tracers.vz[i]);
    }
    for (let i = 0; i < JET_CAP; i++) {
      const mesh = this.jets[i];
      mesh.visible = jets.alive[i] === 1;
      if (!mesh.visible) continue;
      mesh.position.set(jets.x[i], jets.y[i], jets.z[i]);
      mesh.rotation.y = Math.atan2(-jets.vx[i], -jets.vz[i]);
    }
    for (let i = 0; i < DRONE_CAP; i++) {
      const mesh = this.drones[i];
      mesh.visible = drones.alive[i] === 1;
      if (!mesh.visible) continue;
      mesh.position.set(drones.x[i], drones.y[i], drones.z[i]);
      mesh.rotation.y = Math.atan2(-drones.vx[i], -drones.vz[i]);
      for (const rotor of this.droneRotors[i]) rotor.rotation.y += 18 * dt;
    }
    for (let i = 0; i < SHELL_CAP; i++) {
      const mesh = this.shells[i];
      mesh.visible = shells.alive[i] === 1;
      if (!mesh.visible) continue;
      mesh.position.set(shells.x[i], shells.y[i], shells.z[i]);
    }
  }

  /** Draw one frame. */
  render(): void {
    this.renderer.render(this.scene, this.camera);
  }
}
