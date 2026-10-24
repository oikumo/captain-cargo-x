/**
 * Bootstrap render glue — per doc/omt-ts-methodology.md §5, engine imports
 * are permitted here (and in src/render|world|fx|loaders only). Wires
 * renderer → view, DOM keys → input map, run → controller, model events →
 * bus → HUD/screens/FX. No gameplay logic lives in this file.
 */
import * as THREE from 'three';
import './ui/styles.css';
import { GameLoop } from './core/loop';
import { EventBus } from './core/bus';
import { InputMap, type InputAction } from './core/input';
import { GameController, type GameEvents } from './core/run-controller';
import { RunModel } from './game/run';
import { loadAll } from './loaders/registry';
import { GameView } from './render/view';
import { Hud } from './ui/hud';
import { Screens } from './ui/screens';

/** GDD §7 control mapping — key codes to input actions. */
const KEYS: Record<string, InputAction> = {
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
  if (!canvas) throw new Error('boot: #game canvas missing');

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  const bus = new EventBus<GameEvents>();
  const input = new InputMap();
  const run = new RunModel({}, { seed: 1337 });
  const controller = new GameController(bus, input, run);
  run.rebindSink(controller); // controller is the run's sink (bootstrap order)

  const templates = await loadAll(); // zero-.glb boot → placeholders
  const view = new GameView(renderer, run, bus, templates);
  new Hud(bus);
  new Screens(bus);

  window.addEventListener('keydown', (e) => {
    if (e.repeat) return;
    const action = KEYS[e.code];
    if (action) {
      input.press(action);
      e.preventDefault();
    }
  });
  window.addEventListener('keyup', (e) => {
    const action = KEYS[e.code];
    if (action) input.release(action);
  });
  window.addEventListener('blur', () => input.clear());

  const loop = new GameLoop({
    requestFrame: (cb) => requestAnimationFrame(cb),
    cancelFrame: (id) => cancelAnimationFrame(id as number),
    now: () => performance.now() / 1000,
  });

  const onResize = (): void => view.resize(window.innerWidth, window.innerHeight);
  window.addEventListener('resize', onResize);
  onResize();

  loop.start((dt) => {
    controller.update(dt); // input intents → state machine → run sim
    view.update(dt); // poll model, animate FX, chase camera
    view.render();
  });
}

boot().catch((err: unknown) => {
  console.error('boot failed:', err);
});
