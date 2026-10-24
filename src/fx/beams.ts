/**
 * FX layer — green lock-on telegraph beams (doc/GDD.md §11: green
 * multi-beam lock-on lasers). Three thin additive beams leave spread
 * origins around the gunship and converge on the player; visible only
 * during the model's `telegraph` phase (view polls, never mutates).
 */
import * as THREE from 'three';

const ORIGINS: ReadonlyArray<readonly [number, number, number]> = [
  [-5, 2, 1],
  [5, 2, 1],
  [0, -3, -2],
];

/**
 * Lock-on beam trio.
 * Pre: constructed once; `update` per frame with the gunship + player
 *      world positions and the telegraph flag from the model.
 * Post: beams stretch gunship→player with a ~4.5 Hz opacity flicker;
 *       hidden outside the telegraph window.
 */
export class LockonBeams {
  readonly group = new THREE.Group();
  private readonly meshes: THREE.Mesh[] = [];
  private readonly material: THREE.MeshBasicMaterial;
  private readonly dir = new THREE.Vector3();
  private readonly mid = new THREE.Vector3();
  private readonly yAxis = new THREE.Vector3(0, 1, 0);

  constructor() {
    const geo = new THREE.BoxGeometry(0.16, 1, 0.16);
    this.material = new THREE.MeshBasicMaterial({
      color: 0x52ff7a,
      transparent: true,
      opacity: 0.7,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    for (let i = 0; i < ORIGINS.length; i++) {
      const mesh = new THREE.Mesh(geo, this.material);
      mesh.visible = false;
      this.group.add(mesh);
      this.meshes.push(mesh);
    }
    this.group.name = 'lockon-beams';
  }

  /**
   * Aim or hide the beams.
   * Pre: `active` = telegraph phase flag; (gx..z) gunship nose, (px..z)
   *      the player position the model locked.
   * Post: each beam runs origin→player, scaled to length, quaternion from
   *       the +Y axis (geometry is Y-unit); shared material flickers.
   */
  update(
    active: boolean,
    gx: number,
    gy: number,
    gz: number,
    px: number,
    py: number,
    pz: number,
    t: number,
  ): void {
    this.material.opacity = active ? 0.5 + 0.35 * Math.sin(t * 28) : 0;
    if (!active) {
      for (const mesh of this.meshes) mesh.visible = false;
      return;
    }
    for (let i = 0; i < this.meshes.length; i++) {
      const [ox, oy, oz] = ORIGINS[i];
      const sx = gx + ox;
      const sy = gy + oy;
      const sz = gz + oz;
      this.dir.set(px - sx, py - sy, pz - sz);
      const len = this.dir.length() || 1;
      this.dir.divideScalar(len);
      this.mid.set(sx + this.dir.x * len * 0.5, sy + this.dir.y * len * 0.5, sz + this.dir.z * len * 0.5);
      const mesh = this.meshes[i];
      mesh.visible = true;
      mesh.position.copy(this.mid);
      mesh.quaternion.setFromUnitVectors(this.yAxis, this.dir);
      mesh.scale.set(1, len, 1);
    }
  }
}
