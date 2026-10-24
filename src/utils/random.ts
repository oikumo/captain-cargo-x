/**
 * Seeded RNG — model layer (methodology §16 #8: gameplay-affecting rolls
 * are always seeded from the run seed; no wall-clock seeding in src/game).
 */

/** Zero-arg stream — `[0, 1)` */
export type Rng = () => number;

/**
 * mulberry32 — tiny, fast, fully deterministic; fits arcade spawning rolls.
 * Pre: any 32-bit-ish seed (coerced via `>>> 0`); every constructed stream
 *      with the same seed replays the same sequence.
 * Post: returns values in [0, 1).
 */
export function makeRng(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Uniform draw in [lo, hi).
 * Pre: `lo < hi`; rng is a makeRng stream.
 * Post: result ∈ [lo, hi).
 */
export function range(rng: Rng, lo: number, hi: number): number {
  return lo + (hi - lo) * rng();
}

/**
 * Mutable holder for the one run RNG stream (controller/owner reseeds it on
 * `start(seed)`; model components read `box.rng` lazily — no rebuilds, so
 * constructor-injected ownership stays stable across runs).
 */
export class RngBox {
  constructor(public rng: Rng) {}
}

