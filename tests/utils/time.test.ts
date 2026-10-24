import { describe, expect, it } from 'vitest';
import { clampDelta } from '../../src/utils/time';

describe('clampDelta', () => {
  it('keeps a normal per-frame delta untouched', () => {
    expect(clampDelta(1 / 60)).toBeCloseTo(1 / 60);
  });

  it('clamps frame spikes to the cap', () => {
    expect(clampDelta(5)).toBeCloseTo(0.1);
    expect(clampDelta(0.9)).toBeCloseTo(0.1);
  });

  it('never rewinds time from a negative delta', () => {
    expect(clampDelta(-3)).toBeCloseTo(0);
  });

  it('honours a custom cap', () => {
    expect(clampDelta(1, 0.25)).toBeCloseTo(0.25);
    expect(clampDelta(0.2, 0.25)).toBeCloseTo(0.2);
  });
});
