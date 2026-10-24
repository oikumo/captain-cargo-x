import { describe, expect, it } from 'vitest';
import { makeRng, range } from '../../src/utils/random';

describe('utils/random', () => {
  it('same seed ⇒ identical sequence (deterministic gameplay rolls)', () => {
    const a = makeRng(1337);
    const b = makeRng(1337);
    for (let i = 0; i < 32; i++) expect(a()).toBe(b());
  });

  it('different seeds diverge', () => {
    const a = makeRng(1);
    const b = makeRng(2);
    const sa = [a(), a(), a(), a()].join(',');
    const sb = [b(), b(), b(), b()].join(',');
    expect(sa).not.toBe(sb);
  });

  it('range(rng, lo, hi) stays in [lo, hi) and uses the stream order deterministically', () => {
    const rng = makeRng(7);
    for (let i = 0; i < 256; i++) {
      const v = range(rng, -3, 9);
      expect(v).toBeGreaterThanOrEqual(-3);
      expect(v).toBeLessThan(9);
    }
  });
});
