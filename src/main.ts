/**
 * Implements the main-boot row of WORK.md "v0.0.1 view slice": the single
 * engine-glue boot per doc/omt-ts-methodology.md §5 (engine imports allowed
 * here and in src/render|world|fx|loaders only). Wiring order: asset
 * registry → scene views → bus/partners (input, RunModel, controller, HUD)
 * → loop. Gameplay logic stays engine-free in src/game; raw key wiring is
 * the one DOM job that lives here (per src/core/CONTEXT.md). Controls per
 * doc/GDD.md §7: ←→↑↓/WASD fly · SPACE fire · ENTER start · R restart ·
 * P pause.
 */
import { GameLoop } from './core/loop';
import { EventBus } from './core/bus';
import { InputMap, type InputAction } from './core/input';
import { GameController, type GameEvents } from './core/run-controller';
import { RunModel } from './game/run';
import { loadRegistry } from './loaders/registry';
import { SceneView } from './render/scene';
import { EntityViews } from './render/entities';
import { Ocean } from './world/ocean';
import { Sky } from './world/sky';
import { Booms } from './fx/booms';
import { LockonBeams } from './fx/beams';
import { Hud } from './ui/hud';

/** Raw `KeyboardEvent.code` → action map (doc/GDD.md §7 control mapping). */
const KEYMAP: Record<string, InputAction> = {
  ArrowLeft: 'left',
  KeyA: 'left',
  ArrowRight: 'right',
  KeyD: 'right',
  ArrowUp: 'up',
  KeyW: 'up',
  ArrowDown: 'down',
  KeyS: 'down',
  Space: 'fire',
  Enter: 'confirm',
  KeyR: 'restart',
  KeyP: 'pause',
};

async function boot(): Promise<void> {
  const canvas = document.querySelector<HTMLCanvasElement>('#game');
  const hudRoot = document.getElementById('hud');
  const screens = document.getElementById('screens');
  if (!canvas || !hudRoot || !screens) throw new Error('boot: #game/#hud/#screens DOM missing');

  const assets = await loadRegistry(); // zero .glb ⇒ placeholders by contract

  const sceneView = new SceneView(canvas);
  new Sky(sceneView.scene);
  const ocean = new Ocean(sceneView.scene);
  const entities = new EntityViews(sceneView.scene, assets);
  const beams = new LockonBeams(sceneView.scene);

  const bus = new EventBus<GameEvents>();
  const booms = new Booms(sceneView.scene, bus);
  const input = new InputMap();

  // Late-bound RunSink: the controller needs the run instance, and the run
  // needs its sink (the controller IS it) — rebind after construction.
  const run = new RunModel({}, { seed: 1337 });
  const controller = new GameController(bus, input, run);
  run.rebindSink(controller);
  new Hud(bus, hudRoot, screens);

  window.addEventListener('keydown', (e) => {
    const action = KEYMAP[e.code];
    if (!action) return;
    e.preventDefault();
    input.press(action);
  });
  window.addEventListener('keyup', (e) => {
    const action = KEYMAP[e.code];
    if (action) input.release(action);
  });
  window.addEventListener('blur', () => input.clear());

  const resize = (): void => sceneView.resize(window.innerWidth, window.innerHeight);
  window.addEventListener('resize', resize);
  resize();

  const loop = new GameLoop({
    requestFrame: (cb) => requestAnimationFrame(cb),
    cancelFrame: (id) => cancelAnimationFrame(id as number),
    now: () => performance.now() / 1000,
  });
  loop.start((dt) => {
    controller.update(dt); // state machine + sim (only advances while playing)
    ocean.update(dt, run.player.x, run.player.z); // waves roll on every screen
    entities.sync(run);
    beams.sync(run);
    booms.update(dt);
    sceneView.follow(run, dt);
    sceneView.render();
  });
}

boot().catch((err) => console.error('boot failed:', err));
