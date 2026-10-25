/**
 * Night sky — static environment view (deep-ocean navy background, fog wall,
 * star shell). Same palette as the original placeholder boot (0x0b1d33).
 * doc/GDD.md §10 aesthetics; placeholder route per spec/asset-pipeline.md.
 */
import * as THREE from 'three';

const SKY = 0x0b1d33;
const STAR_COUNT = 700;

/**
 * Seeds background + fog + stars once; no per-frame work.
 * Pre: added to the scene at boot; camera far ≥ 4200 so the shell stays
 *      inside the volume while sitting outside the 1600 m fog band.
 * Post: stars use `fog: false` — the fog wall never swallows them.
 */
export class Sky {
  constructor(scene: THREE.Scene) {
    scene.background = new THREE.Color(SKY);
    scene.fog = new THREE.Fog(SKY, 200, 1600);

    const pos = new Float32Array(STAR_COUNT * 3);
    for (let i = 0; i < STAR_COUNT; i++) {
      // random point on a sky dome shell (30–90° above the horizon)
      const az = Math.random() * Math.PI * 2;
      const el = (Math.random() * Math.PI) / 3 + Math.PI / 8;
      const r = 2600 + Math.random() * 900;
      pos[i * 3] = Math.cos(az) * Math.cos(el) * r;
      pos[i * 3 + 1] = Math.sin(el) * r;
      pos[i * 3 + 2] = Math.sin(az) * Math.cos(el) * r;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const stars = new THREE.Points(
      geo,
      new THREE.PointsMaterial({ color: 0x9db8d9, size: 4, sizeAttenuation: true, fog: false }),
    );
    stars.frustumCulled = false;
    scene.add(stars);
  }
}
