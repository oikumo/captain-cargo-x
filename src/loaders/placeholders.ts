/**
 * Implements spec/asset-pipeline.md — procedural placeholder factories.
 * Origin & scale contract: nose at −Z, origin at entity center, meters;
 * radii match the hit volumes (spec/enemies.md, spec/objectives.md).
 * Every placeholder is low-poly flat-shaded primitives (boxes/spheres) —
 * v0.0.1 ships with these as the *primary* art, not a stopgap.
 */
import * as THREE from 'three';
import type { ModelKey } from './registry';

const SKY_METAL = 0x9aa3ad;
const SKY_METAL_DARK = 0x7f8892;
const PURPLE = 0x8b5cf6;
const PURPLE_DARK = 0x6d3fd4;
const PURPLE_WING = 0x5b3fa8;
const CANOPY = 0xdfe9ff;
const TAN = 0xcbb684;
const RED = 0xc0392b;
const WOOD = 0x9c6b3f;

function flat(color: number): THREE.MeshLambertMaterial {
  return new THREE.MeshLambertMaterial({ color, flatShading: true });
}

function glow(color: number): THREE.MeshBasicMaterial {
  return new THREE.MeshBasicMaterial({ color });
}

function box(
  w: number,
  h: number,
  d: number,
  mat: THREE.Material,
  x = 0,
  y = 0,
  z = 0,
): THREE.Mesh {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  mesh.position.set(x, y, z);
  return mesh;
}

function ball(
  r: number,
  mat: THREE.Material,
  x = 0,
  y = 0,
  z = 0,
  widthSeg = 8,
  heightSeg = 6,
): THREE.Mesh {
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(r, widthSeg, heightSeg), mat);
  mesh.position.set(x, y, z);
  return mesh;
}

function named(mesh: THREE.Mesh, name: string): THREE.Mesh {
  mesh.name = name;
  return mesh;
}

/** Build the placeholder for one registry key (see MODEL_KEYS in registry). */
export function buildPlaceholder(key: ModelKey): THREE.Object3D {
  const g = new THREE.Group();
  switch (key) {
    case 'player': {
      g.add(box(2.2, 1.3, 5.6, flat(PURPLE)));
      g.add(box(1.3, 0.9, 1.6, flat(PURPLE_DARK), 0, -0.05, -3.3));
      g.add(box(1.0, 0.6, 1.4, flat(CANOPY), 0, 0.85, -0.9));
      g.add(box(7.6, 0.22, 2.0, flat(PURPLE_WING), 0, 0.05, 0.6));
      g.add(box(0.22, 1.4, 1.2, flat(PURPLE_WING), 0, 0.95, 2.5));
      g.add(named(ball(0.42, glow(0x4dd8ff), -0.8, 0.05, 2.9, 6, 4), 'engine'));
      g.add(named(ball(0.42, glow(0x4dd8ff), 0.8, 0.05, 2.9, 6, 4), 'engine'));
      break;
    }
    case 'enemy-jet': {
      g.add(box(1.7, 1.0, 5.0, flat(SKY_METAL)));
      g.add(box(5.6, 0.18, 1.5, flat(SKY_METAL_DARK), 0, 0, 0.3));
      g.add(box(0.18, 0.9, 1.0, flat(SKY_METAL_DARK), 0, 0.6, 2.3));
      break;
    }
    case 'gunship': {
      g.add(box(1.9, 1.1, 5.2, flat(0x77808c)));
      g.add(box(5.8, 0.2, 1.6, flat(0x5f6772), 0, 0, 0.3));
      g.add(named(ball(0.55, glow(0x39ff6a), 0, -0.25, -2.7, 8, 6), 'core'));
      break;
    }
    case 'enemy-drone': {
      g.add(box(1.5, 1.0, 2.4, flat(TAN)));
      g.add(box(0.28, 0.28, 4.6, flat(0xa89668), -1.3, 0.1, 0.4));
      g.add(box(0.28, 0.28, 4.6, flat(0xa89668), 1.3, 0.1, 0.4));
      const rotorWest = named(ball(1.15, flat(0x6b6152), -1.3, 0.75, 0.4, 8, 4), 'rotor');
      const rotorEast = named(ball(1.15, flat(0x6b6152), 1.3, 0.75, 0.4, 8, 4), 'rotor');
      rotorWest.scale.y = 0.12;
      rotorEast.scale.y = 0.12;
      g.add(rotorWest, rotorEast);
      break;
    }
    case 'objective-dome': {
      const dome = new THREE.Mesh(
        new THREE.SphereGeometry(10, 14, 7, 0, Math.PI * 2, 0, Math.PI / 2),
        flat(RED),
      );
      g.add(dome);
      break;
    }
    case 'objective-shield': {
      const shield = new THREE.Mesh(
        new THREE.SphereGeometry(13, 14, 8),
        new THREE.MeshBasicMaterial({
          color: 0xff7eb0,
          transparent: true,
          opacity: 0.27,
          side: THREE.DoubleSide,
          depthWrite: false,
        }),
      );
      g.add(shield);
      break;
    }
    case 'crate': {
      g.add(box(2.2, 2.2, 2.2, flat(WOOD)));
      break;
    }
    case 'tracer': {
      g.add(box(0.32, 0.32, 2.4, glow(0xffa030)));
      break;
    }
    case 'shell': {
      g.add(ball(1.5, new THREE.MeshLambertMaterial({ color: 0x8a2f2f, emissive: 0x551111 }), 0, 0, 0, 8, 6));
      break;
    }
  }
  return g;
}
