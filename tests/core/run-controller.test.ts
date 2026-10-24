import { describe, expect, it } from 'vitest';
import { EventBus } from '../../src/core/bus';
import { InputMap } from '../../src/core/input';
import { GameController, type GameEvents } from '../../src/core/run-controller';
import { RunModel } from '../../src/game/run';
import type { RunSink } from '../../src/game/events';

/**
 * State-machine walkthrough (methodology §9 triads): menu → playing →
 * paused → gameover → restart. Deterministic — injected sink + fake input.
 */
function rig(): { ctl: GameController; bus: EventBus<GameEvents>; input: InputMap; run: RunModel; states: string[] } {
  const bus = new EventBus<GameEvents>();
  const input = new InputMap();
  // The controller IS the run's sink in production — mirror that here via a
  // late-bound forwarding sink (controller needs the run in its ctor too).
  const box: { sink: RunSink } = { sink: {} };
  const run = new RunModel(
    {
      onScore: (n) => box.sink.onScore?.(n),
      onLives: (n) => box.sink.onLives?.(n),
      onGameOver: () => box.sink.onGameOver?.(),
      onBoom: (e) => box.sink.onBoom?.(e),
    },
    { seed: 1337, threats: false },
  );
  const ctl = new GameController(bus, input, run);
  box.sink = ctl;
  const states: string[] = [];
  bus.on('state', (s) => states.push(s));
  return { ctl, bus, input, run, states };
}

const DT = 1 / 60;

describe('GameController', () => {
  it('starts in menu and Enter begins a fresh run', () => {
    const { ctl, input, run, states } = rig();
    expect(ctl.state).toBe('menu');
    input.press('confirm');
    ctl.update(DT);
    expect(ctl.state).toBe('playing');
    expect(run.state).toBe('live');
    expect(states).toEqual(['playing']);
  });

  it('P pauses and unpauses: the sim freezes while paused', () => {
    const { ctl, input, run } = rig();
    input.press('confirm');
    ctl.update(DT);
    input.release('confirm');
    ctl.update(DT);
    const z = run.player.z;
    input.press('pause');
    ctl.update(DT); // → paused
    input.release('pause');
    expect(ctl.state).toBe('paused');
    ctl.update(0.5);
    expect(run.player.z).toBe(z); // frozen
    input.press('pause');
    ctl.update(DT);
    expect(ctl.state).toBe('playing');
    ctl.update(DT); // the frame after unpause flies again
    expect(run.player.z).toBeLessThan(z);
  });

  it('routes held axes into the run while playing', () => {
    const { ctl, input, run } = rig();
    input.press('confirm');
    ctl.update(DT);
    input.press('left');
    input.press('fire');
    ctl.update(DT);
    expect(run.input.steer).toBe(1);
    expect(run.input.fire).toBe(true);
    input.release('left');
    input.press('right');
    ctl.update(DT);
    expect(run.input.steer).toBe(-1);
  });

  it('game over lands in the gameover state; R restarts', () => {
    const { ctl, input, run, states } = rig();
    input.press('confirm');
    ctl.update(DT);
    input.release('confirm');
    for (let i = 0; i < 6; i++) {
      run.player.reset(run.player.x, 40, run.player.z, 0);
      run.jets.spawnAt(run.player.x, 40, run.player.z, 0, 0, 0);
      ctl.update(DT);
    }
    expect(run.state).toBe('dead');
    expect(ctl.state).toBe('gameover');
    expect(states[states.length - 1]).toBe('gameover');

    input.press('restart');
    ctl.update(DT);
    expect(ctl.state).toBe('playing');
    expect(run.lives).toBe(6);
    expect(run.scoring.score).toBe(0);
  });

  it('relays model events onto the bus (score/lives/boom)', () => {
    const { ctl, bus, input, run } = rig();
    const scores: number[] = [];
    const booms: string[] = [];
    bus.on('score', (n) => scores.push(n));
    bus.on('boom', (e) => booms.push(e.kind));
    input.press('confirm');
    ctl.update(DT);
    input.release('confirm');
    run.jets.spawnAt(0, 30, -120, 0, 0, 0);
    run.player.reset(0, 30, 0, 0);
    run.player.speed = 0;
    input.press('fire');
    for (let i = 0; i < 90; i++) ctl.update(DT);
    expect(scores[0]).toBe(0);
    expect(scores[scores.length - 1]).toBe(300);
    expect(booms).toContain('jet');
  });
});
