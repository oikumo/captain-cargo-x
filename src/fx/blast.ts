/**
 * FX layer — expanding translucent blast spheres (doc/GDD.md §11: pink/
 * orange translucent blast + shield-burst spheres). Pool of 6, reused by
 * ring overwrite; each blast scales out and fades over ~0.55 s.
 */
import * as THREE from 'three';

const POOL = 6;
const DURATION = 0.55;

interface BlastSlot {
  mesh: THREE.Mesh;
  material: THREE.MeshBasicMaterial;
  life: number;
  radius: number;
}

/**
 * Blast-sphere pool.
 * Pre: constructed once; `spawn` from the view's boom mapping.
 * Post: dead meshes hidden; live meshes scale out to `radius` with easing
 *       and fade opacity toward 0.
 */
export class Blasts {
  readonly group = new THREE.Group();
  private readonly slots: BlastSlot[] = [];
  private cursor = 0;

  constructor() {
    const geo = new THREE.SphereGeometry(1, 12, 8);
    for (let i = 0; i < POOL; i++) {
      const material = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0,
        depthWrite: false,
      });
      const mesh = new THREE.Mesh(geo, material);
      mesh.visible = false;
      this.group.add(mesh);
      this.slots.push({ mesh, material, life: 0, radius: 1 });
    }
    this.group.name = 'blasts';
  }

  /**
   * Fire one blast at a world position.
   * Pre: `radius` = final blast radius in meters; `color` = 0xRRGGBB.
   * Post: oldest slot claimed; mesh visible and expanding.
   */
  spawn(x: number, y: number, z: number, radius: number, color: number): void {
    const slot = this.slots[this.cursor];
    this.cursor = (this.cursor + 1) % POOL;
    slot.mesh.position.set(x, y, z);
    slot.mesh.scale.setScalar(1);
    slot.material.color.setHex(color);
    slot.life = DURATION;
    slot.radius = radius;
    slot.mesh.visible = true;
  }

  /**
   * Advance live blasts.
   * Post: scale eases out (fast start, soft landing), opacity tracks the
   *       remaining life; expired slots hide.
   */
  update(dt: number): void {
    for (const slot of this.slots) {
      if (slot.life <= 0) continue;
      slot.life -= dt;
      if (slot.life <= 0) {
        slot.mesh.visible = false;
        continue;
      }
      const t = 1 - slot.life / DURATION;
      const eased = 1 - (1 - t) * (1 - t);
      slot.mesh.scale.setScalar(1 + (slot.radius - 1) * eased);
      slot.material.opacity = 0.55 * (slot.life / DURATION);
    }
  }
}
