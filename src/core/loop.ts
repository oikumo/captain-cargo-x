/**
 * Frame-loop owner — controller layer (`src/core`): no engine imports, no
 * DOM (policy: doc/omt-ts-methodology.md §5).
 */
import { clampDelta } from '../utils/time';

export type FrameCallback = (dt: number) => void;

/**
 * Injectable scheduling seam (partner pattern — methodology §6). Tests drive
 * the loop deterministically by mocking this interface.
 */
export interface LoopClock {
  /** Schedule the next frame; returns a frame id usable with `cancelFrame`. */
  requestFrame(cb: () => void): unknown;
  /** Cancel a pending frame id (safe on already-fired ids). */
  cancelFrame(id: unknown): void;
  /** Monotonic clock in **seconds** — injected so gameplay stays replayable. */
  now(): number;
}

/**
 * Owns the animation cadence; emits clamped second-deltas to one subscriber.
 *
 * Pre: callbacks start/stop may be called any number of times.
 * Post: while running, at most one frame is outstanding; `stop()` cancels it;
 *       emitted deltas are clamped to `maxDt` seconds.
 */
export class GameLoop {
  private readonly clock: LoopClock;
  private readonly maxDt: number;
  private running = false;
  private frameId: unknown = null;
  private onFrame: FrameCallback | null = null;
  private lastS = 0;

  constructor(clock: LoopClock, maxDt = 0.1) {
    this.clock = clock;
    this.maxDt = maxDt;
  }

  start(onFrame: FrameCallback): void {
    if (this.running) return;
    this.running = true;
    this.onFrame = onFrame;
    this.lastS = this.clock.now();
    this.schedule();
  }

  stop(): void {
    if (!this.running) return;
    this.running = false;
    this.onFrame = null;
    if (this.frameId !== null) this.clock.cancelFrame(this.frameId);
    this.frameId = null;
  }

  private schedule(): void {
    this.frameId = this.clock.requestFrame(() => this.tick());
  }

  private tick(): void {
    if (!this.running) return;
    const nowS = this.clock.now();
    const dt = clampDelta(nowS - this.lastS, this.maxDt);
    this.lastS = nowS;
    if (this.onFrame) this.onFrame(dt);
    this.schedule();
  }
}
