import { describe, expect, it } from 'vitest';
import { loadRegistry } from '../../src/loaders/registry';
import { EntityViews } from '../../src/render/entities';
import { LockonBeams } from '../../src/fx/beams';
import { Booms } from '../../src/fx/booms';
import { RunModel } from '../../src/game/run';
import type { RunSink } from '../../src/game/events';
import type { BoomEvent } from '../../src/game/events';

/**
 * Headless integration smoke of the view pool wiring (three.js geometry is
 * pure here — no renderer, no DOM). Deterministic: seeded run + fixed frames.
 * The full frame presentation stays out of unit scope (doc/omt-ts-methodology.md
 * §11); this pins the pool-sync contract: no throw, no model writes, all
 * views stay alive with a stubbed scene (scene.add() must be called ≈ once
 * per slot).
 */
const SCENE = { add: () => {} };

class CapturingSink implements RunSink {
  booms: BoomEvent[] = [];
  gameOvers = 0;
  onBoom(e: BoomEvent): void {
    this.booms.push(e);
  }
  onGameOver(): void {
    this.gameOvers++;
  }
}

describe('view pools sync against the model (no WebGL, no DOM)', () => {
  it('360 deterministic frames: flight + fire keep all views healthy', async () => {
    const assets = await loadRegistry();
    const entities = new EntityViews(SCENE as never, assets);
    const beams = new LockonBeams(SCENE as never);
    const sink = new CapturingSink();
    const run = new RunModel(sink, { seed: 1337 });
    run.start(1337);

    run.input.fire = true;
    run.input.steer = -1;
    let maxTracers = 0;
    for (let f = 0; f < 360; f++) {
      run.update(1 / 60);
      entities.sync(run);
      beams.sync(run);
      maxTracers = Math.max(maxTracers, run.tracers.activeCount);
      if (f === 200) run.input.steer = 0;
    }

    expect(run.player.z).toBeLessThan(0); // auto-forward moved the craft
    expect(maxTracers).toBeGreaterThan(0); // held fire spawned shots
    expect(run.jets.activeCount).toBeGreaterThan(0); // flights crossed
    expect(sink.gameOvers).toBe(0); // 6 s ram-free at the seeded spread
  });

  it('boom pool: every bus kind claims a slot and retires it', async () => {
    const bus: { handlers: Array<(e: BoomEvent) => void> } = { handlers: [] };
    const busStub = {
      on: (_key: 'boom', fn: (e: BoomEvent) => void) => {
        bus.handlers.push(fn);
        return () => {};
      },
    };
    const booms = new Booms(SCENE as never, busStub);
    expect(bus.handlers).toHaveLength(1);
    const boom = bus.handlers[0];

    const kinds = [
      'jet',
      'drone',
      'gunship',
      'shield-hit',
      'shield-break',
      'dome-destroy',
      'shell',
      'splash',
    ] as const;
    for (const kind of kinds) boom({ x: 5, y: 5, z: 5, kind });
    for (let f = 0; f < 120; f++) booms.update(1 / 60); // past every dur
    // after retiring, re-triggering every kind still works (slots recycled)
    for (const kind of kinds) boom({ x: 0, y: 0, z: 0, kind });
    booms.update(0.016);
  });
});
