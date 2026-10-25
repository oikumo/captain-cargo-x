/**
 * Implements the v0.0.1 spec/asset-pipeline.md route in-scene: pooled entity
 * renders, one preallocated mesh per model pool slot, synced read-only from
 * RunModel state every frame (methodology §5: views poll, never mutate).
 * Cosmetic feedback (muzzle window, i-frame blink, thruster glow, shield
 * pulse 0.27 ± 0.08 at 6 Hz, crate orbit r 16) reads only public poll
 * fields. Zero allocation in `sync`.
 */
import * as THREE from 'three';
import type { RunModel } from '../game/run';
import { MUZZLE_S } from '../game/player';
import { DRONE_CAP } from '../game/enemy-drone';
import { JET_CAP } from '../game/enemy-jet';
import { SHELL_CAP } from '../game/shells';
import { TRACER_CAP } from '../game/tracers';
import type { AssetRegistry } from '../loaders/registry';
import type { AssetKey } from '../loaders/placeholders';

const CRATE_COUNT = 4;
const CRATE_ORBIT_R = 16; // spec/objectives.md: 4 decorative crates, orbit r 16
const CRATE_ORBIT_RATE = 0.9; // rad/s

/** Registry prototype clone — pool slots share geometry/materials. */
function clone(assets: AssetRegistry, key: AssetKey): THREE.Object3D {
  const proto = assets.get(key);
  if (!proto) throw new Error(`views: registry missing '${key}'`);
  return proto.clone();
}

/** Named children of a prototype root (placeholder contract, e.g. 'rotor'). */
function collectNamed(root: THREE.Object3D, name: string): THREE.Object3D[] {
  const out: THREE.Object3D[] = [];
  root.traverse((o) => {
    if (o.name === name) out.push(o);
  });
  return out;
}

/** Additive glow quad (muzzle flash / thruster), plane facing local +Z. */
function glow(w: number, h: number, color: number): THREE.Mesh {
  return new THREE.Mesh(
    new THREE.PlaneGeometry(w, h),
    new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    }),
  );
}

/**
 * Entity mesh pool owner for one scene.
 * Pre: built once per boot with a loaded registry — slots are clone-once.
 * Post: `sync` is the only frame API — pose/visibility writes on pools; the
 *       model state is never written (view layer contract).
 */
export class EntityViews {
  private readonly player: THREE.Object3D;
  private readonly muzzle: THREE.Mesh;
  private readonly muzzleMat: THREE.MeshBasicMaterial;
  private readonly thruster: THREE.Mesh;
  private readonly thrusterMat: THREE.MeshBasicMaterial;
  private readonly jets: THREE.Object3D[] = [];
  private readonly drones: THREE.Object3D[] = [];
  private readonly shells: THREE.Object3D[] = [];
  private readonly tracers: THREE.Object3D[] = [];
  private readonly droneRotors: THREE.Object3D[][] = [];
  private readonly gunship: THREE.Object3D;
  private readonly dome: THREE.Object3D;
  private readonly shield: THREE.Object3D;
  private readonly shieldMat: THREE.MeshBasicMaterial;
  private readonly crates: THREE.Object3D[] = [];
  private readonly target = new THREE.Vector3();

  constructor(scene: THREE.Scene, assets: AssetRegistry) {
    this.player = clone(assets, 'player');
    this.thruster = glow(4.6, 2.8, 0x4d9fff);
    this.thruster.position.set(0, 0.1, 5.3);
    this.muzzle = glow(5, 5, 0xffd180);
    this.muzzle.position.set(0, 0, -5.8);
    this.muzzleMat = this.muzzle.material as THREE.MeshBasicMaterial;
    this.thrusterMat = this.thruster.material as THREE.MeshBasicMaterial;
    this.thrusterMat.opacity = 0.7;
    this.muzzle.visible = false;
    this.player.add(this.thruster, this.muzzle);
    scene.add(this.player);

    for (let i = 0; i < JET_CAP; i++) {
      const mesh = clone(assets, 'enemy-jet');
      mesh.visible = false;
      this.jets.push(mesh);
      scene.add(mesh);
    }
    for (let i = 0; i < DRONE_CAP; i++) {
      const mesh = clone(assets, 'enemy-drone');
      mesh.visible = false;
      this.drones.push(mesh);
      this.droneRotors.push(collectNamed(mesh, 'rotor'));
      scene.add(mesh);
    }
    for (let i = 0; i < SHELL_CAP; i++) {
      const mesh = clone(assets, 'shell');
      mesh.visible = false;
      this.shells.push(mesh);
      scene.add(mesh);
    }
    for (let i = 0; i < TRACER_CAP; i++) {
      const mesh = clone(assets, 'tracer');
      mesh.visible = false;
      this.tracers.push(mesh);
      scene.add(mesh);
    }

    this.gunship = clone(assets, 'gunship');
    this.dome = clone(assets, 'objective-dome');
    this.shield = clone(assets, 'objective-shield');
    this.shieldMat = (this.shield as THREE.Mesh).material as THREE.MeshBasicMaterial;
    this.gunship.visible = false;
    this.dome.visible = false;
    this.shield.visible = false;
    scene.add(this.gunship, this.dome, this.shield);
    for (let i = 0; i < CRATE_COUNT; i++) {
      const crate = clone(assets, 'crate');
      crate.visible = false;
      this.crates.push(crate);
      scene.add(crate);
    }
  }

  /**
   * Mirror one frame of model state onto the pools (read-only poll).
   * Pre: run any phase — idle/dead render their frozen last pose.
   * Post: every pooled mesh pose/visibility matches the model arrays.
   */
  sync(run: RunModel): void {
    const simTime = run.simTime;
    const p = run.player;

    // player: spec pose; i-frame blink via player.md poll fields (view only)
    this.player.visible = p.invulnS <= 0 || Math.sin(simTime * 26) > -0.35;
    this.player.position.set(p.x, p.y, p.z);
    this.player.rotation.set(0, p.yaw, p.bank);
    this.thrusterMat.opacity = 0.55 + 0.2 * Math.sin(simTime * 9);
    this.muzzle.visible = p.muzzleS > 0;
    if (this.muzzle.visible) {
      this.muzzleMat.opacity = 0.25 + 0.75 * (p.muzzleS / MUZZLE_S);
    }

    const jets = run.jets;
    for (let i = 0; i < this.jets.length; i++) {
      const mesh = this.jets[i];
      if (jets.alive[i] === 0) {
        mesh.visible = false;
        continue;
      }
      mesh.position.set(jets.x[i], jets.y[i], jets.z[i]);
      mesh.rotation.set(0, Math.atan2(-jets.vx[i], -jets.vz[i]), 0);
      mesh.visible = true;
    }

    const drones = run.drones;
    for (let i = 0; i < this.drones.length; i++) {
      const mesh = this.drones[i];
      if (drones.alive[i] === 0) {
        mesh.visible = false;
        continue;
      }
      mesh.position.set(drones.x[i], drones.y[i], drones.z[i]);
      mesh.rotation.set(0, Math.atan2(-drones.vx[i], -drones.vz[i]), 0);
      mesh.visible = true;
      // props whirl from the sim clock (frozen sim ⇒ frozen spin, by design)
      for (const rotor of this.droneRotors[i]) rotor.rotation.y = run.simTime * 18;
    }

    const shells = run.shells;
    for (let i = 0; i < this.shells.length; i++) {
      const mesh = this.shells[i];
      if (shells.alive[i] === 0) {
        mesh.visible = false;
        continue;
      }
      mesh.position.set(shells.x[i], shells.y[i], shells.z[i]);
      mesh.visible = true;
    }

    const tracers = run.tracers;
    for (let i = 0; i < this.tracers.length; i++) {
      const mesh = this.tracers[i];
      if (tracers.alive[i] === 0) {
        mesh.visible = false;
        continue;
      }
      mesh.position.set(tracers.x[i], tracers.y[i], tracers.z[i]);
      this.target.set(
        tracers.x[i] + tracers.vx[i],
        tracers.y[i] + tracers.vy[i],
        tracers.z[i] + tracers.vz[i],
      );
      mesh.lookAt(this.target);
      mesh.visible = true;
    }

    this.syncGunship(run);
    this.syncObjective(run, simTime);
  }

  private syncGunship(run: RunModel): void {
    const lk = run.lockon;
    if (!lk.active) {
      this.gunship.visible = false;
      return;
    }
    this.gunship.position.set(lk.x, lk.y, lk.z);
    // hull faces the player (purely cosmetic — the sim never reads it)
    this.gunship.rotation.set(0, Math.atan2(-(run.player.x - lk.x), -(run.player.z - lk.z)), 0);
    this.gunship.visible = true;
  }

  private syncObjective(run: RunModel, simTime: number): void {
    const dome = run.dome;
    const live = dome.active;
    this.dome.visible = live;
    this.shield.visible = live && !dome.broken;
    for (const crate of this.crates) crate.visible = live;
    if (!live) return;

    this.dome.position.set(dome.x, dome.y, dome.z);
    this.shield.position.set(dome.x, dome.y, dome.z);
    // spec/objectives.md pulse: 0.27 ± 0.08 sine at ~6 Hz on the run clock
    this.shieldMat.opacity = 0.27 + 0.08 * Math.sin(simTime * Math.PI * 2 * 6);
    const base = simTime * CRATE_ORBIT_RATE;
    for (let i = 0; i < this.crates.length; i++) {
      const a = base + i * (Math.PI / 2);
      this.crates[i].position.set(
        dome.x + Math.cos(a) * CRATE_ORBIT_R,
        dome.y - 6 + 1.5 * Math.sin(simTime * 2.2 + i * 1.7),
        dome.z + Math.sin(a) * CRATE_ORBIT_R,
      );
    }
  }
}
