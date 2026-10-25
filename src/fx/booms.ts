/**
 * Pooled boom FX — one preallocated burst table consumed by `boom` bus
 * events (fx reacts to bus moments per methodology §5/§15; the model never
 * touches the view). Vocabulary per doc/GDD.md §11: warm explosion
 * particles on kills, pink/orange translucent blast spheres on shield
 * break / dome destroy, small impact sparks, blue splash particles.
 * FX timing is cosmetic (not gameplay RNG): Math.random here is allowed.
 */
import * as THREE from 'three';
import { lerp } from '../utils/math';
import type { BoomEvent } from '../game/events';

const BURST_CAP = 14; // simultaneous bursts (kills are ≤ a few / second)
const PARTS = 26; // particle budget per burst slot (sized by kind, below)

interface KindFx {
  count: number;
  speedMin: number;
  speedMax: number;
  grav: number;
  dur: number;
  color: number;
  /** Translucent blast-sphere visuals: start/end radius, opacity cap. */
  blastStart: number;
  blastEnd: number;
  blastColor: number;
  /** false ⇒ no blast sphere for this kind. */
  blast: boolean;
  /** Splash particles fly up; other kinds burst radially. */
  splash: boolean;
}

const KINDS: Record<string, KindFx> = {
  jet:        { count: 26, speedMin: 12, speedMax: 34, grav: 9,  dur: 0.7,  color: 0xffa726, blastStart: 1, blastEnd: 8,  blastColor: 0xffc178, blast: true,  splash: false },
  drone:      { count: 22, speedMin: 10, speedMax: 30, grav: 9,  dur: 0.65, color: 0xffb74d, blastStart: 1, blastEnd: 7,  blastColor: 0xffc178, blast: true,  splash: false },
  gunship:    { count: 26, speedMin: 14, speedMax: 38, grav: 9,  dur: 0.8,  color: 0xff8a50, blastStart: 1.5, blastEnd: 10, blastColor: 0xffc178, blast: true, splash: false },
  shell:      { count: 18, speedMin: 8,  speedMax: 26, grav: 9,  dur: 0.6,  color: 0xff7043, blastStart: 1, blastEnd: 6,  blastColor: 0xff5722, blast: true,  splash: false },
  'shield-hit': { count: 10, speedMin: 4, speedMax: 14, grav: 3, dur: 0.3, color: 0xffe0b2, blastStart: 2, blastEnd: 13, blastColor: 0xffc0a0, blast: true, splash: false },
  'shield-break': { count: 24, speedMin: 12, speedMax: 30, grav: 7, dur: 0.65, color: 0xff5c8a, blastStart: 3, blastEnd: 26, blastColor: 0xff8a5c, blast: true, splash: false },
  'dome-destroy': { count: 26, speedMin: 16, speedMax: 40, grav: 10, dur: 0.95, color: 0xff7043, blastStart: 4, blastEnd: 55, blastColor: 0xff4d6a, blast: true, splash: false },
  splash:     { count: 18, speedMin: 8,  speedMax: 22, grav: 26, dur: 0.7,  color: 0x7ec8ff, blastStart: 0, blastEnd: 0,  blastColor: 0xffffff, blast: false, splash: true },
};

interface Slot {
  active: boolean;
  t: number;
  dur: number;
  grav: number;
  points: THREE.Points;
  geo: THREE.BufferGeometry;
  pos: Float32Array;
  vel: Float32Array;
  colors: Float32Array;
  mat: THREE.PointsMaterial;
  count: number;
  blast: THREE.Mesh;
  blastMat: THREE.MeshBasicMaterial;
  blastOn: boolean;
  blastEnd: number;
  blastMaxOp: number;
}

/**
 * Partner seam (methodology §6): the boom source needs exactly `on('boom')` —
 * the typed `EventBus` satisfies it structurally.
 */
export interface BoomSource {
  on(key: 'boom', fn: (e: BoomEvent) => void): () => void;
}

const WHITE = new Float32Array([1, 1, 1]);

/**
 * Boom burst pool for one scene, driven by the `boom` bus event.
 * Pre: one instance per boot; bus lives as long as the loop.
 * Post: trigger claims a slot (free first, else the closest to finishing);
 *       update advances/retires bursts — both allocation-free.
 */
export class Booms {
  private readonly slots: Slot[] = [];

  constructor(scene: THREE.Scene, bus: BoomSource) {
    for (let i = 0; i < BURST_CAP; i++) {
      const pos = new Float32Array(PARTS * 3);
      const colors = new Float32Array(PARTS * 3);
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
      geo.setDrawRange(0, 0);
      const mat = new THREE.PointsMaterial({
        size: 2.6,
        vertexColors: true,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const points = new THREE.Points(geo, mat);
      points.frustumCulled = false;
      points.visible = false;
      scene.add(points);

      const geoB = new THREE.SphereGeometry(1, 12, 8);
      const blastMat = new THREE.MeshBasicMaterial({
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
      });
      const blast = new THREE.Mesh(geoB, blastMat);
      blast.frustumCulled = false;
      blast.visible = false;
      scene.add(blast);

      this.slots.push({
        active: false,
        t: 0,
        dur: 1,
        grav: 0,
        points,
        geo,
        pos,
        vel: new Float32Array(PARTS * 3),
        colors,
        mat,
        count: 0,
        blast,
        blastMat,
        blastOn: false,
        blastEnd: 0,
        blastMaxOp: 0,
      });
    }
    bus.on('boom', (e) => this.trigger(e));
  }

  /** Route one boom moment to a pool slot. */
  private trigger(e: BoomEvent): void {
    const fx = KINDS[e.kind];
    if (!fx) return;
    const slot = this.pick();
    slot.active = true;
    slot.t = 0;
    slot.dur = fx.dur;
    slot.grav = fx.grav;
    slot.count = fx.count;
    slot.geo.setDrawRange(0, fx.count);
    const base = new THREE.Color(fx.color);
    for (let i = 0; i < fx.count; i++) {
      slot.pos[i * 3] = e.x;
      slot.pos[i * 3 + 1] = e.y;
      slot.pos[i * 3 + 2] = e.z;
      // proper unit sphere; cosmetic only → Math.random is fine here
      const az = Math.random() * Math.PI * 2;
      const z = Math.random() * 2 - 1;
      const r = Math.sqrt(Math.max(0, 1 - z * z));
      const speed = lerp(fx.speedMin, fx.speedMax, Math.random());
      let vx = r * Math.cos(az) * speed;
      let vy = z * speed;
      let vz = r * Math.sin(az) * speed;
      if (fx.splash) {
        vy = Math.abs(z) * speed * 0.9 + speed * 0.45; // splash flies up
        vx *= 0.5;
        vz *= 0.5;
      }
      slot.vel[i * 3] = vx;
      slot.vel[i * 3 + 1] = vy;
      slot.vel[i * 3 + 2] = vz;
      const w = Math.random() * 0.4; // toward-white variation
      slot.colors[i * 3] = base.r + (WHITE[0] - base.r) * w;
      slot.colors[i * 3 + 1] = base.g + (WHITE[1] - base.g) * w;
      slot.colors[i * 3 + 2] = base.b + (WHITE[2] - base.b) * w;
    }
    slot.geo.attributes.position.needsUpdate = true;
    slot.geo.attributes.color.needsUpdate = true;
    slot.points.visible = true;

    slot.blastOn = fx.blast;
    slot.blast.visible = fx.blast;
    if (fx.blast) {
      slot.blastEnd = fx.blastEnd;
      slot.blastMaxOp = 0.85;
      slot.blastMat.color.set(fx.blastColor);
      slot.blastMat.opacity = slot.blastMaxOp;
      slot.blast.position.set(e.x, e.y, e.z);
      slot.blast.scale.setScalar(fx.blastStart);
    }
  }

  /** Oldest-active claim: first inactive slot, else the nearly-finished one. */
  private pick(): Slot {
    let best = this.slots[0];
    let bestScore = Infinity;
    for (const s of this.slots) {
      if (!s.active) return s;
      const left = s.dur - s.t;
      if (left < bestScore) {
        bestScore = left;
        best = s;
      }
    }
    return best;
  }

  /**
   * Advance and retire bursts.
   * Pre: dt ≥ 0; called every frame (even paused — FX is presentation).
   * Post: opacity/easing follow each slot's own clock; no allocation.
   */
  update(dt: number): void {
    for (const slot of this.slots) {
      if (!slot.active) continue;
      slot.t += dt;
      if (slot.t >= slot.dur) {
        slot.active = false;
        slot.points.visible = false;
        slot.blast.visible = false;
        continue;
      }
      const k = slot.t / slot.dur;
      const pa = slot.pos;
      const va = slot.vel;
      for (let i = 0; i < slot.count; i++) {
        va[i * 3 + 1] -= slot.grav * dt;
        pa[i * 3] += va[i * 3] * dt;
        pa[i * 3 + 1] += va[i * 3 + 1] * dt;
        pa[i * 3 + 2] += va[i * 3 + 2] * dt;
      }
      slot.geo.attributes.position.needsUpdate = true;
      slot.mat.opacity = 1 - k;
      if (slot.blastOn) {
        const ease = 1 - (1 - k) * (1 - k); // ease-out expansion
        slot.blast.scale.setScalar(lerp(1, slot.blastEnd, ease));
        slot.blastMat.opacity = slot.blastMaxOp * (1 - k);
      }
    }
  }
}
