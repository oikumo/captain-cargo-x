import { describe, expect, it } from 'vitest';
import { clamp, damp, lerp } from '../../src/utils/math';

describe('utils/math', () => {
  it('clamp bounds a value to [lo, hi] without moving in-range values', () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(-1, 0, 10)).toBe(0);
    expect(clamp(11, 0, 10)).toBe(10);
  });

  it('lerp interpolates linearly between endpoints', () => {
    expect(lerp(0, 10, 0)).toBe(0);
    expect(lerp(0, 10, 1)).toBe(10);
    expect(lerp(0, 10, 0.25)).toBeCloseTo(2.5);
  });

  it('damp converges monotonically and reaches the target in finite big-dt time', () => {
    let v = 10;
    v = damp(v, 0, 4, 0.016);
    expect(v).toBeLessThan(10);
    expect(v).toBeGreaterThan(0);
    v = damp(v, 0, 4, 100); // huge dt must snap to the target, never overshoot
    expect(v).toBe(0);
  });
});
