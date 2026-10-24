import { describe, expect, it } from 'vitest';
import { RunModel, type RunSink } from '../../src/game/run';
import type { BoomEvent } from '../../src/game/events';

/**
 * Recording sink + injected clock: the run sim is pure — same seed +
 * same script ⇒ same outcome (methodology §11 stage-2 integration; §16 D6).
 *
 * Oracles: spec/player.md (flight/cannon/damage) · spec/enemies.md
 * (spawns/collisions) · spec/objectives.md (dome) · spec/scoring.md (lives).
 */
interface Recording {
  booms: BoomEvent[];
  scores: number[];
  lives: number[];
  gameOver: number;
}
function recordingSink(): { sink: RunSink; rec: Recording } {
  const rec: Recording = { booms: [], scores: [], lives: [], gameOver: 0 };
  const sink: RunSink = {
    onScore: (n) => rec.scores.push(n),
    onLives: (n) => rec.lives.push(n),
    onGameOver: () => rec.gameOver++,
    onBoom: (e) => rec.booms.push(e),
  };
  return { sink, rec };
}

const DT = 1 / 60;

function liveRun(seed = 1337, threats = true): { run: RunModel; rec: Recording } {
  const { sink, rec } = recordingSink();
  const run = new RunModel(sink, { seed, threats });
  run.start();
  return { run, rec };
}

function steps(run: RunModel, seconds: number, dt = DT): void {
  for (let i = 0; i < Math.round(seconds / dt); i++) run.update(dt);
}

describe('RunModel — player flight (spec/player.md rows)', () => {
  it('auto-forwards at 120 m/s down −Z from (0, 40, 0)', () => {
    const { run } = liveRun();
    run.update(0.5);
    expect(run.player.z).toBeCloseTo(-60);
    expect(run.player.x).toBeCloseTo(0);
    expect(run.player.y).toBeCloseTo(40);
  });

  it('+steer yaws left at 1.6 rad/s with bank into the turn', () => {
    const { run } = liveRun();
    run.input.steer = 1;
    steps(run, 1);
    run.input.steer = 0;
    expect(run.player.yaw).toBeCloseTo(1.6, 4);
    expect(run.player.x).toBeLessThan(-50); // course bent left
    expect(Math.abs(run.player.bank)).toBeGreaterThan(0.2);
  });

  it('clamps altitude to the [10, 90] band both ways', () => {
    const { run } = liveRun();
    run.input.climb = 1;
    steps(run, 10);
    expect(run.player.y).toBe(90);
    run.input.climb = -1;
    steps(run, 15);
    expect(run.player.y).toBe(10);
  });
});

describe('RunModel — cannon (spec/player.md cannon rows)', () => {
  it('fires at cooldown cadence (≈10/s) and arms the muzzle flash', () => {
    const { run } = liveRun(1337, false); // no director noise on the line
    run.player.reset(0, 30, 0, 0);
    run.player.speed = 0; // hover drill — speed is a tunable, spec table
    run.input.fire = true;
    steps(run, 1);
    run.input.fire = false;
    expect(run.tracers.activeCount).toBeGreaterThanOrEqual(9);
    expect(run.tracers.activeCount).toBeLessThanOrEqual(11);
    expect(run.player.muzzleS).toBeGreaterThan(0);
  });

  it('a tracer pool never grows past its 64-slot ring under sustained fire', () => {
    const { run } = liveRun(1337, false);
    run.player.speed = 0;
    run.input.fire = true;
    steps(run, 9);
    run.input.fire = false;
    expect(run.tracers.length).toBe(64);
    expect(run.tracers.activeCount).toBeLessThanOrEqual(64);
  });
});

describe('RunModel — threats, spawns, collisions (spec/enemies.md)', () => {
  it('fields one full 3–6 jet flight by t = 5.5 s (no second flight before 6 s)', () => {
    const { run } = liveRun();
    steps(run, 5.5);
    expect(run.jets.activeCount).toBeGreaterThanOrEqual(3);
    expect(run.jets.activeCount).toBeLessThanOrEqual(6);
  });

  it('tracers kill a placed jet for 300 base (no collateral life loss)', () => {
    const { run, rec } = liveRun(1337, false);
    run.player.reset(0, 30, 0, 0);
    run.player.speed = 0; // hover drill — speed is a tunable, spec table
    run.jets.spawnAt(0, 30, -120, 0, 0, 0);
    run.input.fire = true;
    steps(run, 1.5);
    run.input.fire = false;
    expect(run.jets.activeCount).toBe(0);
    expect(rec.booms.map((b) => b.kind)).toContain('jet');
    expect(run.lives).toBe(6);
    expect(run.scoring.score).toBe(300);
  });

  it('chains three placed kills inside the window → 300 + 450 + 600', () => {
    const { run } = liveRun(1337, false);
    run.player.reset(0, 30, 0, 0);
    run.player.speed = 0;
    run.jets.spawnAt(0, 30, -120, 0, 0, 0);
    run.jets.spawnAt(0, 30, -165, 0, 0, 0);
    run.jets.spawnAt(0, 30, -210, 0, 0, 0);
    run.input.fire = true;
    steps(run, 1.5);
    run.input.fire = false;
    expect(run.scoring.score).toBe(1350);
    expect(run.scoring.streak).toBe(3);
  });

  it('rams cost one life; i-frames block the follow-up inside 1.5 s', () => {
    const { run } = liveRun();
    run.jets.spawnAt(run.player.x, run.player.y, run.player.z, 0, 0, 0);
    run.update(DT);
    expect(run.lives).toBe(5);
    run.jets.spawnAt(run.player.x, run.player.y, run.player.z, 0, 0, 0);
    run.update(DT);
    expect(run.lives).toBe(5); // i-frames — jet still explodes, no life lost
    steps(run, 1.6);
    expect(run.player.invulnS).toBe(0);
    run.jets.spawnAt(run.player.x, run.player.y, run.player.z, 0, 0, 0);
    run.update(DT);
    expect(run.lives).toBe(4);
  });

  it('an enemy shell costs one life and dies on contact; i-frame contact fizzles harmlessly', () => {
    const { run } = liveRun();
    run.shells.spawn(run.player.x + 10, run.player.y, run.player.z, -50, 0, 0);
    steps(run, 0.3);
    expect(run.lives).toBe(5);
    expect(run.shells.activeCount).toBe(0); // exploded on contact
    run.shells.spawn(run.player.x, run.player.y, run.player.z, 0, 0, 0);
    steps(run, 0.1);
    expect(run.lives).toBe(5); // i-frames are already armed
    expect(run.shells.activeCount).toBe(0); // fizzled harmlessly
  });

  it('shells reaching the water splash out', () => {
    const { run } = liveRun();
    run.shells.spawn(0, 6, -100, 0, -20, 0);
    steps(run, 1);
    expect(run.shells.activeCount).toBe(0);
  });

  it('despawns enemies > 3200 m behind the player', () => {
    const { run } = liveRun();
    run.jets.spawnAt(0, 30, run.player.z + 3300, 0, 0, 0);
    run.update(DT);
    expect(run.jets.activeCount).toBe(0);
  });

  it('lock-on fires a dodgeable shell after its telegraph inside ~18 s', () => {
    const { run } = liveRun();
    steps(run, 18);
    expect(run.lockon.firedCount).toBeGreaterThanOrEqual(1);
  });

  it('killing the gunship mid-telegraph cancels its shell', () => {
    const { run, rec } = liveRun(1337, false); // no director noise
    run.lockon.spawnAt(0, 60, -220); // deterministic telegraph
    run.player.reset(0, 60, 0, 0); // nose dead level on the gunship
    run.player.speed = 0;
    run.input.fire = true;
    steps(run, 2.5);
    run.input.fire = false;
    expect(run.lockon.firedCount).toBe(0);
    expect(run.shells.activeCount).toBe(0);
    expect(run.scoring.score).toBe(300); // hp 3 gunship went down
    expect(rec.booms.map((b) => b.kind)).toContain('gunship');
  });
});

describe('RunModel — shield dome (spec/objectives.md rows)', () => {
  it('spawns one dome near the start of a run', () => {
    const { run } = liveRun();
    steps(run, 3);
    expect(run.dome.active).toBe(true);
  });

  it('shield absorbs 18 hits → break (+2500); dome falls on 10 more (+5000)', () => {
    const { run, rec } = liveRun(1337, false); // isolate the tracer line
    run.player.reset(0, 30, 0, 0);
    run.player.speed = 0;
    run.dome.spawnAt(0, 30, -500);
    run.input.fire = true;
    steps(run, 6.5); // spread misses dilute the stream; margin covers them
    run.input.fire = false;
    expect(run.dome.active).toBe(false);
    const kinds = rec.booms.map((b) => b.kind);
    expect(kinds).toContain('shield-break');
    expect(kinds).toContain('dome-destroy');
    expect(run.scoring.score).toBeGreaterThanOrEqual(18 * 50 + 2500 + 5000);
    expect(rec.lives).toEqual([6]); // only the start() paint — no life was ever lost
  });
});

describe('RunModel — lives & lifecycle (spec/scoring.md lives rows)', () => {
  it('six ram cycles → dead state + exactly one gameOver; start() gives a fresh run', () => {
    const { run, rec } = liveRun();
    for (let i = 0; i < 6; i++) {
      run.player.reset(run.player.x, 40, run.player.z, 0); // clear i-frames between hits
      run.jets.spawnAt(run.player.x, 40, run.player.z, 0, 0, 0);
      run.update(DT);
    }
    expect(run.lives).toBe(0);
    expect(run.state).toBe('dead');
    expect(rec.gameOver).toBe(1);
    expect(rec.lives[rec.lives.length - 1]).toBe(0);

    run.start(7);
    expect(run.lives).toBe(6);
    expect(run.scoring.score).toBe(0);
    expect(run.state).toBe('live');
    expect(run.jets.activeCount).toBe(0);
  });

  it('update() does nothing before start() and nothing after game over', () => {
    const { sink, rec } = recordingSink();
    const idle = new RunModel(sink, { seed: 5, threats: false });
    idle.update(1);
    expect(idle.state).toBe('idle');
    expect(idle.player.z).toBe(0);
    expect(idle.simTime).toBe(0);

    idle.start();
    for (let i = 0; i < 6; i++) {
      idle.player.reset(idle.player.x, 40, idle.player.z, 0);
      idle.jets.spawnAt(idle.player.x, 40, idle.player.z, 0, 0, 0);
      idle.update(DT);
    }
    expect(idle.state).toBe('dead');
    const frozenZ = idle.player.z;
    idle.update(1);
    expect(idle.player.z).toBe(frozenZ); // sim frozen after game over
  });

  it('deterministic: same seed + script ⇒ identical trajectory & score', () => {
    const a = liveRun(4242);
    const b = liveRun(4242);
    for (let i = 0; i < 600; i++) {
      a.run.input.steer = Math.sin(i * 0.031);
      a.run.input.climb = Math.cos(i * 0.017);
      a.run.input.fire = i % 20 < 11;
      b.run.input.steer = a.run.input.steer;
      b.run.input.climb = a.run.input.climb;
      b.run.input.fire = a.run.input.fire;
      a.run.update(DT);
      b.run.update(DT);
    }
    expect(b.run.player.x).toBeCloseTo(a.run.player.x, 6);
    expect(b.run.player.y).toBeCloseTo(a.run.player.y, 6);
    expect(b.run.player.z).toBeCloseTo(a.run.player.z, 6);
    expect(b.run.scoring.score).toBe(a.run.scoring.score);
    expect(b.run.lives).toBe(a.run.lives);
  });
});
