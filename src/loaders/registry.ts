/**
 * Implements spec/asset-pipeline.md — async per-key model registry with
 * procedural placeholder fallback. Hard requirement: the game boots with
 * zero `.glb` files; dropping `public/assets/models/<key>.glb` in is a
 * pure upgrade (same scale & origin contract, no gameplay-code changes).
 * Gateway layer: the only place assets are fetched (methodology §7).
 */
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { buildPlaceholder } from './placeholders';

export const MODEL_KEYS = [
  'player',
  'enemy-jet',
  'enemy-drone',
  'gunship',
  'objective-dome',
  'objective-shield',
  'crate',
  'tracer',
  'shell',
] as const;

export type ModelKey = (typeof MODEL_KEYS)[number];

/**
 * Resolve one model: try `assets/models/<key>.glb`, fall back to the
 * procedural placeholder (one console info per key, never warning spam).
 * Pre: key ∈ MODEL_KEYS.
 * Post: resolves with a template Object3D (caller clones per pool slot).
 */
export async function loadModel(key: ModelKey): Promise<THREE.Object3D> {
  try {
    const gltf = await new GLTFLoader().loadAsync(`assets/models/${key}.glb`);
    return gltf.scene;
  } catch {
    console.info(
      `[assets] ${key}.glb absent — procedural placeholder in play ` +
        `(drop public/assets/models/${key}.glb to upgrade)`,
    );
    return buildPlaceholder(key);
  }
}

/**
 * Resolve every registry key in parallel.
 * Post: Map with one template per key — boot awaits this once.
 */
export async function loadAll(): Promise<Map<ModelKey, THREE.Object3D>> {
  const templates = new Map<ModelKey, THREE.Object3D>();
  await Promise.all(
    MODEL_KEYS.map(async (key) => {
      templates.set(key, await loadModel(key));
    }),
  );
  return templates;
}
