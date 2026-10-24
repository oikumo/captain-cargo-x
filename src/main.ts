/**
 * Bootstrap render glue — per doc/omt-ts-methodology.md §5, engine imports
 * are permitted here (and in src/render|world|fx|loaders only). Gameplay
 * logic must stay engine-free; this boot wires renderer + loop, nothing more.
 */
import * as THREE from 'three';
import { GameLoop } from './core/loop';

// Placeholder boot view — deep-ocean night. First real views come from
// src/world|render once an asset pass lands (spec/asset-pipeline.md).
const SKY = 0x0b1d33;

function boot(): void {
  const canvas = document.querySelector<HTMLCanvasElement>('#game');
  if (!canvas) throw new Error('boot: #game canvas missing');

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(SKY);
  scene.fog = new THREE.Fog(SKY, 200, 1600);

  const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 4000);
  camera.position.set(0, 40, 160);
  camera.lookAt(0, 20, 0);

  const loop = new GameLoop({
    requestFrame: (cb) => requestAnimationFrame(cb),
    cancelFrame: (id) => cancelAnimationFrame(id as number),
    now: () => performance.now() / 1000,
  });

  const onResize = (): void => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
  };
  window.addEventListener('resize', onResize);
  onResize();

  // dt is unused until the first sim systems ship (next WORK.md task).
  loop.start((_dt) => renderer.render(scene, camera));
}

boot();
