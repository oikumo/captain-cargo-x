import { beforeEach, describe, expect, it } from 'vitest';
import { Scoring } from '../../src/game/scoring';

/** Oracles: spec/scoring.md — chain rows (window 1.5 s, ×4 cap) + values. */
describe('Scoring', () => {
  let s: Scoring;
  beforeEach(() => {
    s = new Scoring();
  });

  it('awards flat base for the first kill (no streak multiplier)', () => {
    expect(s.addKill(0, 300)).toBe(300);
    expect(s.score).toBe(300);
    expect(s.streak).toBe(1);
  });

  it('keeps the streak inside the 1.5 s window and applies 1 + 0.5·(streak−1)', () => {
    s.addKill(0, 300);
    expect(s.addKill(1.0, 300)).toBe(450); // ×1.5
    expect(s.addKill(2.4, 300)).toBe(600); // ×2.0
    expect(s.addKill(2.5, 300)).toBe(750); // ×2.5 (streak 4)
  });

  it('caps the multiplier at ×4 (reached on the 7th chain kill)', () => {
    let last = 0;
    for (const t of [0, 0.1, 0.2, 0.3, 0.4, 0.6]) last = s.addKill(t, 300);
    expect(last).toBe(1050); // 6th kill: ×3.5
    expect(s.addKill(0.7, 300)).toBe(1200); // 7th kill: 1+0.5·6 = ×4 exactly
    expect(s.addKill(0.8, 300)).toBe(1200); // further kills stay at the cap
  });

  it('resets the streak once the window expires', () => {
    s.addKill(0, 300);
    s.addKill(1.0, 300); // streak 2
    expect(s.addKill(10, 300)).toBe(300); // window over → streak 1 again
    expect(s.streak).toBe(1);
  });

  it('neutral shield hits never touch the kill streak', () => {
    s.addKill(0, 300);
    expect(s.addShieldHit(50)).toBe(50);
    expect(s.streak).toBe(1);
    expect(s.addKill(0.5, 300)).toBe(450); // streak still 2 after the shield hit
  });

  it('addFlat awards raw points and ignores the streak', () => {
    s.addKill(0, 300);
    expect(s.addFlat(2500)).toBe(2500);
    expect(s.score).toBe(2800);
    expect(s.addKill(0.4, 300)).toBe(450); // second kill in-chain unchanged
  });

  it('reset() wipes score, streak and window', () => {
    s.addKill(0, 300);
    s.addKill(1, 300);
    s.addFlat(5000);
    s.reset();
    expect(s.score).toBe(0);
    expect(s.streak).toBe(0);
    expect(s.addKill(0, 300)).toBe(300); // window starts fresh
  });
});
