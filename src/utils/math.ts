/**
 * Pure math helpers — model layer: no `three`, no DOM, no wall clock
 * (policy: doc/omt-ts-methodology.md §5). OpSpec-style Pre/Post on each
 * exported function (methodology §10).
 */

/**
 * Clamp to an inclusive range.
 * Pre: any finite number; `lo ≤ hi`.
 * Post: result ∈ [lo, hi]; NaN-safe callers beware — inputs are trusted.
 */
export function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v;
}

/**
 * Linear interpolation.
 * Pre: `t` typically in [0, 1]; extrapolates outside by contract.
 * Post: `a` at t=0, `b` at t=1`.
 */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/**
 * Frame-rate independent smoothing toward a target (exp decay).
 * Pre: `rate` > 0 s⁻¹; `dt` ≥ 0 seconds.
 * Post: monotonic step toward `target`; huge `dt` snaps to `target`
 *       (never overshoots) — used for camera/bank smoothing.
 */
export function damp(current: number, target: number, rate: number, dt: number): number {
  const t = 1 - Math.exp(-rate * dt);
  return current + (target - current) * t;
}
