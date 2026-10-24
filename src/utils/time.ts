/**
 * Pure time helpers — `src/utils` is model-layer: no engine imports, no DOM
 * (policy: doc/omt-ts-methodology.md §5).
 */

/**
 * Clamp a raw frame delta for the game loop.
 *
 * Pre: `dt` seconds, any finite number (negative tolerated on timer drift).
 * Post: result ∈ [0, max] — frame spikes (tab switch, GC pause) never
 *       explode simulation steps, and time never rewinds.
 */
export function clampDelta(dt: number, max = 0.1): number {
  return Math.min(Math.max(dt, 0), max);
}
