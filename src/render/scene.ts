/**
 * Scene view — three.js assembly view (methodology §5): renderer, lights,
 * damped chase camera. Reads player state every frame (pull), never writes.
 * Engine imports permitted only in this folder/main/loaders/fx/world.
 */
import * as THREE from 'three';
import type { RunModel } from '../game/run';
import { damp } from '../utils/math';

const CAM_BACK = 30; // m behind the craft
const CAM_UP = 11;
const CAM_LEAD = 50; // m ahead on the course line
const POS_RATE = 5; // s⁻¹ position smoothing
const LOOK_RATE = 7; // s⁻¹ look-target smoothing
const HEMI = 0x4a628f;
const GROUND = 0x0b2438;

/**
 * Owns the WebGL renderer + scene + camera.
 * Pre: one instance per boot on the #game canvas.
 * Post: stateless frame API — `follow` polls, `render` draws; resizing is
 *       bootstrap-driven, never automatic.
 */
export class SceneView {
  readonly scene: THREE.Scene;
  readonly camera: THREE.PerspectiveCamera;
  private readonly renderer: THREE.WebGLRenderer;
  private readonly camPos = new THREE.Vector3(0, 51, 30);
  private readonly lookPos = new THREE.Vector3(0, 38, -45);

  constructor(canvas: HTMLCanvasElement) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.scene = new THREE.Scene();

    this.camera = new THREE.PerspectiveCamera(62, 1, 0.5, 4200);
    this.scene.add(this.camera);

    const hemi = new THREE.HemisphereLight(HEMI, GROUND, 1.1);
    this.scene.add(hemi);
    const moon = new THREE.DirectionalLight(0xbcd2ff, 1.6);
    moon.position.set(220, 380, 180);
    this.scene.add(moon);
  }

  resize(w: number, h: number): void {
    this.renderer.setSize(w, h);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  /**
   * Chase-camera poll: damped position behind + look target ahead of the
   * craft (doc/GDD.md §3 speed feel; camera roll stays 0 — bank is mesh-only).
   * Pre: run state any; dt ≥ 0.
   * Post: camera pose updated in place (the two Vector3 fields are the only
   *       smoothing state; no allocation).
   */
  follow(run: RunModel, dt: number): void {
    const p = run.player;
    const fx = -Math.sin(p.yaw);
    const fz = -Math.cos(p.yaw);
    this.camPos.x = damp(this.camPos.x, p.x - fx * CAM_BACK, POS_RATE, dt);
    this.camPos.z = damp(this.camPos.z, p.z - fz * CAM_BACK, POS_RATE, dt);
    this.camPos.y = damp(this.camPos.y, Math.max(p.y + CAM_UP, 9), POS_RATE, dt);
    this.lookPos.x = damp(this.lookPos.x, p.x + fx * CAM_LEAD, LOOK_RATE, dt);
    this.lookPos.z = damp(this.lookPos.z, p.z + fz * CAM_LEAD, LOOK_RATE, dt);
    this.lookPos.y = damp(this.lookPos.y, p.y - 2, LOOK_RATE, dt);

    this.camera.position.copy(this.camPos);
    this.camera.lookAt(this.lookPos);
    // rider roll with the bank — cosmetic (the dist/heading math ignores it)
    this.camera.rotateZ(-p.bank * 0.22);
  }

  render(): void {
    this.renderer.render(this.scene, this.camera);
  }
}
