import { describe, expect, it } from 'vitest';
import { InputMap } from '../../src/core/input';

describe('InputMap', () => {
  it('tracks held state between press/release', () => {
    const map = new InputMap();
    expect(map.isDown('fire')).toBe(false);
    map.press('fire');
    expect(map.isDown('fire')).toBe(true);
    map.release('fire');
    expect(map.isDown('fire')).toBe(false);
  });

  it('consume() is an edge: true exactly once per press', () => {
    const map = new InputMap();
    map.press('pause'); // key-repeat storm must not stack edges
    map.press('pause');
    expect(map.consume('pause')).toBe(true);
    expect(map.consume('pause')).toBe(false);
    map.release('pause');
    map.press('pause');
    expect(map.consume('pause')).toBe(true);
  });

  it('release clears both hold and pending edge (menus lose focus)', () => {
    const map = new InputMap();
    map.press('confirm');
    map.release('confirm');
    expect(map.consume('confirm')).toBe(false);
    expect(map.isDown('confirm')).toBe(false);
  });

  it('clear() wipes all state', () => {
    const map = new InputMap();
    map.press('left');
    map.press('restart');
    map.clear();
    expect(map.isDown('left')).toBe(false);
    expect(map.consume('restart')).toBe(false);
  });
});
