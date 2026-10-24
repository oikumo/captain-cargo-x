/**
 * World layer — procedural low-poly ocean (doc/GDD.md §10: vast flat-shaded
 * sea, subtle wave shading). CPU sine waves write into one preallocated
 * position buffer — zero per-frame allocation; the mesh recenters under the
 * player so the sea is effectively endless.
 */
import * as THREE from 'three';

const SIZE = 4200;
const SEGMENTS = 80;

/**
 * The one ocean plane.
 * Pre: constructed once per view; `update` called per frame.
 * Post: vertex heights recomputed from world-space coordinates each frame
 *       (wave phase is position-stable under recentering); flat shading
 *       gives the chunky retro facets.
 */
export class Ocean {
  readonly mesh: THREE.Mesh;
  private readonly heights: Float32Array;

  constructor() {
    const geo = new THREE.PlaneGeometry(SIZE, SIZE, SEGMENTS, SEGMENTS);
    geo.rotateX(-Math.PI / 2);
    const attr = geo.attributes.position as THREE.BufferAttribute;
    attr.setUsage(THREE.DynamicDrawUsage);
    this.heights = attr.array as Float32Array;
    const mat = new THREE.MeshLambertMaterial({ color: 0x175f96, flatShading: true });
    this.mesh = new THREE.Mesh(geo, mat);
    this.mesh.frustumCulled = false;
    this.mesh.name = 'ocean';
  }

  /**
   * Recenter + re-wave the plane.
   * Pre: `t` = run clock seconds; (px, pz) = player world position.
   * Post: mesh.position = (px, 0, pz); heights = wave(worldX, worldZ, t).
   */
  update(t: number, px: number, pz: number): void {
    this.mesh.position.set(px, 0, pz);
    const h = this.heights;
    for (let i = 0; i < h.length; i += 3) {
      const x = h[i] + px;
      const z = h[i + 2] + pz;
      h[i + 1] =
        1.15 * Math.sin(x * 0.045 + t * 1.35) +
        0.85 * Math.sin(z * 0.037 - t * 0.9) +
        0.6 * Math.sin((x + z) * 0.021 + t * 0.6);
    }
    (this.mesh.geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;
  }
}
