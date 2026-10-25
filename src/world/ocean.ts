/**
 * Low-poly night ocean — environment view per doc/GDD.md §10: vast plane,
 * subtle CPU wave shading (~7.7 k verts, the frame-budget line), shallow
 * teal patches as the off-course visual cue. Placeholders ride the
 * spec/asset-pipeline.md zero-`.glb` route.
 */
import * as THREE from 'three';

const SIZE = 4200; // m — spans past the 1600 m fog wall in every direction
const SEGS = 87; // ⇒ 88² = 7744 verts (WORK.md budget: 7.7 k)
const DEEP = new THREE.Color(0x123a5e);
const TEAL = new THREE.Color(0x2ba392);

function waveY(wx: number, wz: number, t: number): number {
  return (
    0.9 * Math.sin(wx * 0.045 + t * 1.1) * Math.sin(wz * 0.037 - t * 0.9) +
    0.35 * Math.sin((wx + wz) * 0.11 + t * 2.3)
  );
}

/** Shallow-teal density field (GDD §9 Q3: visual cue only, not a hazard). */
function shallowness(wx: number, wz: number): number {
  return (
    Math.sin(wx * 0.004 + 1.7) * Math.sin(wz * 0.005 - 0.4) +
    0.5 * Math.sin(wx * 0.012) * Math.cos(wz * 0.009)
  );
}

/**
 * Endless ocean plane following the player. Waves/colors are computed from
 * world coordinates, so gliding the mesh under the camera never re-phases
 * them.
 *
 * Pre: one instance added to the scene at boot. `flatShading` drives shading
 * from screen-space derivatives — the normal attribute is untouched per frame.
 * Post: zero allocation in `update` (attribute arrays written in place).
 */
export class Ocean {
  private readonly geo = new THREE.PlaneGeometry(SIZE, SIZE, SEGS, SEGS).rotateX(
    -Math.PI / 2,
  ) as THREE.PlaneGeometry;
  private readonly mesh: THREE.Mesh;
  private t = 0;

  constructor(scene: THREE.Scene) {
    const count = this.geo.attributes.position.count;
    this.geo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(count * 3), 3));
    this.mesh = new THREE.Mesh(
      this.geo,
      new THREE.MeshPhongMaterial({
        vertexColors: true,
        flatShading: true,
        shininess: 10,
      }),
    );
    scene.add(this.mesh);
  }

  /**
   * Advance the wave clock and re-anchor the plane under the player.
   * Pre: `dt` ≥ 0 seconds; player world x/z meters.
   * Post: wave phase and shallow-teal colors re-sampled at the new anchor.
   */
  update(dt: number, px: number, pz: number): void {
    this.t += dt;
    const pos = this.geo.attributes.position;
    const col = this.geo.attributes.color;
    const pa = pos.array as Float32Array;
    const ca = col.array as Float32Array;
    for (let i = 0; i < pos.count; i++) {
      const wx = px + pa[i * 3];
      const wz = pz + pa[i * 3 + 2];
      pa[i * 3 + 1] = waveY(wx, wz, this.t);
      // deep → teal blend; band tuned so teal reads as rare coastal patches
      const k = Math.min(1, Math.max(0, (shallowness(wx, wz) - 0.62) * 3));
      ca[i * 3] = DEEP.r + (TEAL.r - DEEP.r) * k;
      ca[i * 3 + 1] = DEEP.g + (TEAL.g - DEEP.g) * k;
      ca[i * 3 + 2] = DEEP.b + (TEAL.b - DEEP.b) * k;
    }
    pos.needsUpdate = true;
    col.needsUpdate = true;
    this.mesh.position.set(px, 0, pz);
  }
}
