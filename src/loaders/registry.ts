/**
 * Implements spec/asset-pipeline.md — the glTF registry with placeholder
 * fallback (the v0.0.1 shipping route). Every key tries its
 * `assets/models/<key>.glb` first; a missing/unloadable file falls back to
 * the procedural placeholder factory with the same origin & scale contract,
 * one-line console info per key. The game must run with zero exported files
 * (hard requirement) and upgrading an asset stays drop-in here only.
 */
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { placeholderFor, REGISTRY_KEYS, type AssetKey } from './placeholders';

export type AssetRegistry = Map<AssetKey, THREE.Object3D>;

/**
 * Load every registry key's prototype.
 * Pre: once per boot, before views are built (views clone per pool slot).
 * Post: map with an entry per REGISTRY_KEYS — network miss ⇒ placeholder.
 * Exc: never rejects (each key resolves on its own; boot continues zero-.glb).
 */
export async function loadRegistry(): Promise<AssetRegistry> {
  const loader = new GLTFLoader();
  const entries = await Promise.all(
    REGISTRY_KEYS.map(async (key): Promise<[AssetKey, THREE.Object3D]> => {
      try {
        const gltf = await loader.loadAsync(`assets/models/${key}.glb`);
        return [key, gltf.scene];
      } catch {
        console.info(`[assets] '${key}': no .glb — procedural placeholder (spec/asset-pipeline.md)`);
        return [key, placeholderFor(key)];
      }
    }),
  );
  return new Map(entries);
}
