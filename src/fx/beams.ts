/**
 * Lock-on telegraph view — green converging beams from the gunship toward
 * the player's lock position (spec/enemies.md: "green converging beams
 * telegraph ~1.5 s", doc/GDD.md §4/§11). Polled model state only; beams
 * exist during the telegraph phase and converge as its timer runs out.
 */
import * as THREE from 'three';
import type { RunModel } from '../game/run';

const BEAM_COUNT = 4;
const ORIGIN_OFFSET = 5.5; // beam roots around the gunship hull (m)
const SPREAD_BASE = 1.5; // m the pattern never fully collapses to one point

const UP = new THREE.Vector3(0, 1, 0); // shared read-only axis

/**
 * Four additive green beams, unit-cylinder meshes stretched between points.
 * Pre: added to one scene; sync called every frame.
 * Post: visible only while `lockon.phase === 'telegraph'`; endpoints track
 *       `telegraphProgress` (1 → 0). No allocation.
 */
export class LockonBeams {
  private readonly beams: THREE.Mesh[] = [];
  private readonly dir = new THREE.Vector3();

  constructor(scene: THREE.Scene) {
    const geo = new THREE.CylinderGeometry(0.22, 0.22, 1, 5, 1, true);
    const mat = new THREE.MeshBasicMaterial({
      color: 0x39ff6a,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    for (let i = 0; i < BEAM_COUNT; i++) {
      const mesh = new THREE.Mesh(geo, mat);
      mesh.visible = false;
      scene.add(mesh);
      this.beams.push(mesh);
    }
  }

  sync(run: RunModel): void {
    const lk = run.lockon;
    const on = lk.phase === 'telegraph';
    for (const beam of this.beams) beam.visible = on;
    if (!on) return;

    const prog = lk.telegraphProgress; // 1 → 0 as the shell launch nears
    const spread = SPREAD_BASE + 9 * prog;
    const p = run.player;
    for (let i = 0; i < BEAM_COUNT; i++) {
      const ox = lk.x + (i & 1 ? ORIGIN_OFFSET : -ORIGIN_OFFSET);
      const oz = lk.z + (i & 2 ? ORIGIN_OFFSET : -ORIGIN_OFFSET);
      const tx = p.x + (i & 1 ? spread : -spread);
      const ty = p.y + (i & 2 ? spread * 0.4 : -spread * 0.4);
      const tz = p.z + (i & 2 ? spread : -spread);
      const dx = tx - ox;
      const dy = ty - lk.y;
      const dz = tz - oz;
      const len = Math.hypot(dx, dy, dz) || 1;
      const beam = this.beams[i];
      beam.position.set((ox + tx) / 2, (lk.y + ty) / 2, (oz + tz) / 2);
      this.dir.set(dx / len, dy / len, dz / len);
      beam.quaternion.setFromUnitVectors(UP, this.dir);
      beam.scale.set(1, len, 1);
    }
  }
}
