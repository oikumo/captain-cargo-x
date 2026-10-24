import { describe, expect, it } from 'vitest';
import { GameLoop, type LoopClock } from '../../src/core/loop';

/**
 * Deterministic scheduler seam: scripted clock + manually fired frames.
 * `fire(dt)` advances the fake clock and runs exactly one queued frame,
 * mirroring the browser rAF contract.
 */
class FakeClock implements LoopClock {
  scheduled: Array<() => void> = [];
  tS = 0;

  now(): number {
    return this.tS;
  }

  requestFrame(cb: () => void): unknown {
    this.scheduled.push(cb);
    return this.scheduled.length - 1;
  }

  cancelFrame(id: unknown): void {
    this.scheduled[Number(id)] = () => {
      /* cancelled — fired as a no-op */
    };
  }

  fire(dt: number): void {
    this.tS += dt;
    this.scheduled.shift()?.();
  }
}

describe('GameLoop', () => {
  it('pumps one frame per request and starts with a zero baseline delta', () => {
    const clock = new FakeClock();
    const loop = new GameLoop(clock);
    const deltas: number[] = [];
    loop.start((dt) => deltas.push(dt));

    clock.fire(1 / 60);
    clock.fire(1 / 60);
    expect(deltas.length).toBe(2);
    // First fire measures against the baseline taken in start().
    expect(deltas[0]).toBeCloseTo(1 / 60);
    expect(deltas[1]).toBeCloseTo(1 / 60);
  });

  it('clamps frame spikes to maxDt', () => {
    const clock = new FakeClock();
    const loop = new GameLoop(clock);
    const deltas: number[] = [];
    loop.start((dt) => deltas.push(dt));

    clock.fire(5); // tab-switch-sized spike
    expect(deltas[0]).toBeCloseTo(0.1);
  });

  it('stop() cancels the outstanding frame and the callback goes silent', () => {
    const clock = new FakeClock();
    const loop = new GameLoop(clock);
    let calls = 0;
    loop.start(() => {
      calls++;
    });

    clock.fire(1 / 60);
    expect(calls).toBe(1);

    loop.stop();
    clock.fire(1 / 60); // queued frame is a cancelled no-op
    expect(calls).toBe(1);
  });

  it('start() is idempotent while running', () => {
    const clock = new FakeClock();
    const loop = new GameLoop(clock);
    let calls = 0;
    loop.start(() => {
      calls++;
    });

    loop.start(() => {
      calls++;
    });
    expect(clock.scheduled.length).toBe(1); // second start() must not queue twice
    clock.fire(1 / 60);
    expect(calls).toBe(1);
  });
});
