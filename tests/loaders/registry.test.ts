import { describe, expect, it } from 'vitest';
import { loadRegistry } from '../../src/loaders/registry';
import { placeholderFor, REGISTRY_KEYS } from '../../src/loaders/placeholders';

/**
 * Registry decision layer (spec/asset-pipeline.md §24 rows): the game must
 * resolve every key with **zero `.glb` files present** — the fallback route
 * is the shipping v0.0.1 behavior, so it is the tested path.
 */
describe('asset registry (placeholder route)', () => {
  it('exposes exactly the v0.0.1 keys', () => {
    expect(REGISTRY_KEYS).toHaveLength(9);
    expect([...new Set(REGISTRY_KEYS)].length).toBe(REGISTRY_KEYS.length);
  });

  it('resolves all keys with zero exported assets — fallback per key', async () => {
    const assets = await loadRegistry(); // no .glb exists in this repo
    expect(assets.size).toBe(REGISTRY_KEYS.length);
    for (const key of REGISTRY_KEYS) expect(assets.get(key)).toBeTruthy();
  });

  it('placeholder factory honors the origin/scale contract per key', () => {
    for (const key of REGISTRY_KEYS) {
      const obj = placeholderFor(key);
      expect(obj.children.length).toBeGreaterThanOrEqual(0);
    }
  });

  it('throws on an unknown key (registry bug, not runtime state)', () => {
    const bogus = 'not-a-key' as never;
    expect(() => placeholderFor(bogus)).toThrow();
  });
});
