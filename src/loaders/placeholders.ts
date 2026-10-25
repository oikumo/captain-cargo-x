/**
 * Implements spec/asset-pipeline.md — procedural low-poly placeholder
 * factories for every registry key. Each factory honors the origin & scale
 * contract: nose at −Z, origin at entity center, meters, ~1:1 with the
 * spec/enemies.md hit radii. Flat-shaded retro (doc/GDD.md art direction).
 * Zero `.glb` required — these are the shipping v0.0.1 visuals.
 */
import * as THREE from 'three';

export type AssetKey =
  | 'player'
  | 'enemy-jet'
  | 'enemy-drone'
  | 'gunship'
  | 'objective-dome'
  | 'objective-shield'
  | 'crate'
  | 'tracer'
  | 'shell';

export const REGISTRY_KEYS: readonly AssetKey[] = [
  'player',
  'enemy-jet',
  'enemy-drone',
  'gunship',
  'objective-dome',
  'objective-shield',
  'crate',
  'tracer',
  'shell',
];

interface BoxSpec {
  w: number;
  h: number;
  d: number;
  x?: number;
  y?: number;
  z?: number;
}

/** Compose a flat-shaded low-poly craft from axis-aligned boxes. */
function craft(parts: Array<BoxSpec & { color: number }>): THREE.Group {
  const group = new THREE.Group();
  for (const p of parts) {
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(p.w, p.h, p.d),
      new THREE.MeshPhongMaterial({ color: p.color, flatShading: true, shininess: 24 }),
    );
    mesh.position.set(p.x ?? 0, p.y ?? 0, p.z ?? 0);
    group.add(mesh);
  }
  return group;
}

/** Purple hover-fighter (doc/GDD.md §1, §3) — hit radius ~6. */
function player(): THREE.Object3D {
  return craft([
    { w: 3.0, h: 1.3, d: 9.0, color: 0x8a4ce6 }, // fuselage, nose at −Z
    { w: 1.3, h: 0.8, d: 2.6, y: 0.8, z: -1.2, color: 0x5c2fa8 }, // canopy
    { w: 9.6, h: 0.3, d: 3.0, y: -0.1, z: 0.7, color: 0x8a4ce6 }, // wings
    { w: 0.3, h: 1.7, d: 1.9, y: 1.0, z: 3.3, color: 0x8a4ce6 }, // tail fin
  ]);
}

/** Grey crossing jet (spec/enemies.md) — hit radius 7. */
function enemyJet(): THREE.Object3D {
  return craft([
    { w: 2.4, h: 1.0, d: 7.0, color: 0x9aa5b1 },
    { w: 6.4, h: 0.3, d: 2.6, z: 0.9, color: 0x8b96a2 },
    { w: 0.25, h: 1.3, d: 1.5, y: 0.6, z: 2.9, color: 0x9aa5b1 },
  ]);
}

/** Twin-boom patrol drone — hit radius 8, hugs the water. */
function enemyDrone(): THREE.Object3D {
  const group = craft([
    { w: 0.55, h: 0.55, d: 7.6, x: -1.8, color: 0x6d7787 },
    { w: 0.55, h: 0.55, d: 7.6, x: 1.8, color: 0x6d7787 },
    { w: 4.2, h: 0.35, d: 0.45, z: 1.4, color: 0x5a6371 }, // cross-bar
    { w: 1.9, h: 1.0, d: 2.7, y: 0.35, z: -0.6, color: 0x7d8796 }, // center pod
  ]);
  // named props — the view spins children called 'rotor' (cosmetic)
  const rotorGeo = new THREE.BoxGeometry(2.6, 0.1, 0.35);
  const rotorMat = new THREE.MeshPhongMaterial({ color: 0x4b5563, flatShading: true, shininess: 10 });
  for (const side of [-1.8, 1.8]) {
    const rotor = new THREE.Mesh(rotorGeo, rotorMat);
    rotor.name = 'rotor';
    rotor.position.set(side, 0.5, -2.9);
    group.add(rotor);
  }
  return group;
}

/** Lock-on gunship (hp 3) — same hit radius as a jet. */
function gunship(): THREE.Object3D {
  return craft([
    { w: 4.2, h: 2.2, d: 11.0, color: 0x54636f },
    { w: 10.5, h: 0.5, d: 3.4, z: 1.2, color: 0x485662 },
    { w: 2.0, h: 1.4, d: 3.2, x: -2.6, z: 0.6, color: 0x485662 },
    { w: 2.0, h: 1.4, d: 3.2, x: 2.6, z: 0.6, color: 0x485662 },
  ]);
}

/** Red hemispherical dome, r 10 (spec/objectives.md structure). */
function objectiveDome(): THREE.Object3D {
  return new THREE.Mesh(
    new THREE.SphereGeometry(10, 14, 7, 0, Math.PI * 2, 0, Math.PI / 2),
    new THREE.MeshPhongMaterial({ color: 0xd9414e, flatShading: true, shininess: 30 }),
  );
}

/**
 * Translucent pink/orange shield bubble, r 13. Its material is pulse-animated
 * by the entity view (0.27 ± 0.08 sine, ~6 Hz — spec/objectives.md feedback).
 */
function objectiveShield(): THREE.Object3D {
  const mesh = new THREE.Mesh(
    new THREE.SphereGeometry(13, 14, 9),
    new THREE.MeshBasicMaterial({
      color: 0xff8a5c,
      transparent: true,
      opacity: 0.27,
      side: THREE.DoubleSide,
      depthWrite: false,
    }),
  );
  mesh.renderOrder = 2;
  return mesh;
}

/** Decorative orbiting crate (2.4-ish m cube). */
function crate(): THREE.Object3D {
  return new THREE.Mesh(
    new THREE.BoxGeometry(2.6, 2.6, 2.6),
    new THREE.MeshPhongMaterial({ color: 0xa97d43, flatShading: true, shininess: 10 }),
  );
}

/** Orange tracer bolt (spec/player.md cannon rows) — long axis Z. */
function tracer(): THREE.Object3D {
  return new THREE.Mesh(
    new THREE.BoxGeometry(0.6, 0.6, 5.4),
    new THREE.MeshBasicMaterial({ color: 0xffa640 }),
  );
}

/** Enemy shell bolt (slow, dodgeable — spec/enemies.md). */
function shell(): THREE.Object3D {
  return new THREE.Mesh(
    new THREE.SphereGeometry(2.0, 8, 6),
    new THREE.MeshBasicMaterial({ color: 0xff4d4d }),
  );
}

/**
 * Placeholder factory per key.
 * Pre: `key` ∈ REGISTRY_KEYS.
 * Post: a prototype Object3D — callers clone per pool slot, never re-derive.
 * Exc: unknown key throws (registry bug, not runtime state).
 */
export function placeholderFor(key: AssetKey): THREE.Object3D {
  switch (key) {
    case 'player': return player();
    case 'enemy-jet': return enemyJet();
    case 'enemy-drone': return enemyDrone();
    case 'gunship': return gunship();
    case 'objective-dome': return objectiveDome();
    case 'objective-shield': return objectiveShield();
    case 'crate': return crate();
    case 'tracer': return tracer();
    case 'shell': return shell();
    default: throw new Error(`placeholders: unknown key '${key as string}'`);
  }
}
