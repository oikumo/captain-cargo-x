/**
 * World layer — sky/fog/lighting rig (doc/GDD.md §10 world vocabulary:
 * bright low-poly arcade day). Engine imports are permitted here
 * (methodology §5); the module is view-only, never touches model state.
 */
import * as THREE from 'three';

export const SKY_COLOR = 0x8fc3ea;

/**
 * Apply the sky rig to a scene.
 * Pre: fresh scene (called once at view construction).
 * Post: background + fog matched to the sky color (fog swallows the
 *       ocean horizon), hemisphere ambient + one directional sun added.
 */
export function applySky(scene: THREE.Scene): void {
  scene.background = new THREE.Color(SKY_COLOR);
  scene.fog = new THREE.Fog(SKY_COLOR, 420, 2400);
  const hemi = new THREE.HemisphereLight(0xcfe8ff, 0x123a5e, 1.15);
  const sun = new THREE.DirectionalLight(0xfff3d6, 1.6);
  sun.position.set(180, 320, 90);
  scene.add(hemi, sun);
}
