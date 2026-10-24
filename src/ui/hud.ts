/**
 * Implements spec/hud.md — pure-DOM bottom bar: lives bars (6, skewed) ·
 * purple ship icon · chunky right-aligned score digits. Updates flow
 * exclusively via bus events; the HUD holds no game state (except its own
 * DOM). No three.js in this layer.
 */
import type { EventBus } from '../core/bus';
import type { GameEvents } from '../core/run-controller';

/**
 * The bottom HUD bar.
 * Pre: constructed once at boot with the app bus.
 * Post: repaints lives dimming (opacity 0.25) and score digits on events;
 *       `pointer-events: none` — never intercepts input.
 */
export class Hud {
  private readonly bars: HTMLElement[] = [];
  private readonly scoreEl: HTMLElement;

  constructor(bus: EventBus<GameEvents>) {
    const root = document.createElement('div');
    root.id = 'hud';

    const lives = document.createElement('div');
    lives.className = 'lives';
    for (let i = 0; i < 6; i++) {
      const bar = document.createElement('span');
      bar.className = 'bar';
      lives.appendChild(bar);
      this.bars.push(bar);
    }

    const ship = document.createElement('div');
    ship.className = 'ship-icon';
    ship.innerHTML =
      '<svg viewBox="0 0 64 64" width="52" height="52" aria-hidden="true">' +
      '<path d="M32 4 L38 22 L60 34 L38 38 L36 52 L32 46 L28 52 L26 38 L4 34 L26 22 Z" ' +
      'fill="#9b59ff" stroke="#c9b2ff" stroke-width="2" stroke-linejoin="round"/></svg>';

    const score = document.createElement('div');
    score.className = 'score';
    this.scoreEl = document.createElement('span');
    this.scoreEl.textContent = '0';
    score.appendChild(this.scoreEl);

    root.append(lives, ship, score);
    document.body.appendChild(root);

    bus.on('lives', (left) => this.paintLives(left));
    bus.on('score', (total) => {
      this.scoreEl.textContent = String(total);
    });
  }

  /** Remaining bars full opacity; lost bars dim to 0.25 (spec: no exit anim). */
  private paintLives(left: number): void {
    for (let i = 0; i < this.bars.length; i++) {
      this.bars[i].classList.toggle('lost', i >= left);
    }
  }
}
