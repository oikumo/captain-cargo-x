/**
 * FX layer — pooled particle bursts (doc/GDD.md §11: large particle
 * explosions on kills, splash particles). One THREE.Points, 240 slots,
 * preallocated SoA buffers; zero hot-path allocation. Math.random here is
 * deliberate: FX are cosmetic and never gameplay-affecting rolls (the sim's
 * RNG stays seeded in src/game — methodology §16 #8).
 */
import * as THREE from 'three';

const MAX = 240;
const GRAVITY = 14;

interface BurstSpec {
  count: number;
  spread: number;
  r: number;
  g: number;
  b: number;
  up: number;
}

/**
 * Particle burst pool.
 * Pre: constructed once; `spawn`/`update` from the view only.
 * Post: dead slots park at y = −99999 (hidden); colors fade by remaining
 *       life; additive blending for the punchy arcade flash.
 */
export class Bursts {
  readonly points: THREE.Points;
  private readonly pos = new Float32Array(MAX * 3);
  private readonly col = new Float32Array(MAX * 3);
  private readonly vel = new Float32Array(MAX * 3);
  private readonly life = new Float32Array(MAX);
  private readonly maxLife = new Float32Array(MAX);
  private readonly baseCol = new Float32Array(MAX * 3);
  private cursor = 0;

  constructor() {
    this.pos.fill(-99999);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute(
      'position',
      new THREE.BufferAttribute(this.pos, 3).setUsage(THREE.DynamicDrawUsage),
    );
    geo.setAttribute(
      'color',
      new THREE.BufferAttribute(this.col, 3).setUsage(THREE.DynamicDrawUsage),
    );
    const mat = new THREE.PointsMaterial({
      size: 4.5,
      vertexColors: true,
      transparent: true,
      opacity: 0.95,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
    });
    this.points = new THREE.Points(geo, mat);
    this.points.frustumCulled = false;
    this.points.name = 'bursts';
  }

  /**
   * Emit one burst (ring overwrite — a storm of booms recycles oldest).
   * Pre: color components 0–1; `up` biases vertical velocity (splashes).
   */
  spawn(x: number, y: number, z: number, spec: BurstSpec): void {
    for (let n = 0; n < spec.count; n++) {
      const i = this.cursor;
      this.cursor = (this.cursor + 1) % MAX;
      const i3 = i * 3;
      this.pos[i3] = x;
      this.pos[i3 + 1] = y;
      this.pos[i3 + 2] = z;
      const a = Math.random() * Math.PI * 2;
      const u = Math.random() * 2 - 1;
      const s = Math.sqrt(1 - u * u);
      const sp = spec.spread * (0.35 + 0.65 * Math.random());
      this.vel[i3] = s * Math.cos(a) * sp;
      this.vel[i3 + 1] = u * sp + spec.up;
      this.vel[i3 + 2] = s * Math.sin(a) * sp;
      const jitter = 0.8 + Math.random() * 0.2;
      this.baseCol[i3] = spec.r * jitter;
      this.baseCol[i3 + 1] = spec.g * jitter;
      this.baseCol[i3 + 2] = spec.b * jitter;
      const life = 0.45 + Math.random() * 0.45;
      this.life[i] = life;
      this.maxLife[i] = life;
    }
  }

  /**
   * Integrate live particles.
   * Post: positions advance, slight gravity applies, colors scale by
   *       remaining life; expired slots park below the world.
   */
  update(dt: number): void {
    for (let i = 0; i < MAX; i++) {
      if (this.life[i] <= 0) continue;
      const i3 = i * 3;
      this.vel[i3 + 1] -= GRAVITY * dt;
      this.pos[i3] += this.vel[i3] * dt;
      this.pos[i3 + 1] += this.vel[i3 + 1] * dt;
      this.pos[i3 + 2] += this.vel[i3 + 2] * dt;
      this.life[i] -= dt;
      const fade = this.life[i] > 0 ? this.life[i] / this.maxLife[i] : 0;
      this.col[i3] = this.baseCol[i3] * fade;
      this.col[i3 + 1] = this.baseCol[i3 + 1] * fade;
      this.col[i3 + 2] = this.baseCol[i3 + 2] * fade;
      if (this.life[i] <= 0) {
        this.pos[i3 + 1] = -99999;
      }
    }
    (this.points.geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;
    (this.points.geometry.attributes.color as THREE.BufferAttribute).needsUpdate = true;
  }
}

/** Named burst recipes per boom kind — shared with the view mapping. */
export const BURST_SPECS = {
  jet: { count: 26, spread: 26, r: 1.0, g: 0.55, b: 0.15, up: 2 },
  drone: { count: 20, spread: 18, r: 0.95, g: 0.7, b: 0.3, up: 2 },
  gunship: { count: 32, spread: 28, r: 0.6, g: 1.0, b: 0.35, up: 2 },
  shell: { count: 18, spread: 20, r: 1.0, g: 0.45, b: 0.2, up: 0 },
  splash: { count: 22, spread: 14, r: 0.65, g: 0.85, b: 1.0, up: 9 },
  'shield-hit': { count: 8, spread: 10, r: 1.0, g: 0.6, b: 0.75, up: 0 },
  'shield-break': { count: 40, spread: 30, r: 1.0, g: 0.65, b: 0.35, up: 0 },
  'dome-destroy': { count: 60, spread: 40, r: 1.0, g: 0.5, b: 0.2, up: 0 },
} as const satisfies Record<string, BurstSpec>;
