/**
 * Implements spec/hud.md screens — start ("CAPTAIN CARGO X" + hints),
 * game over (final score + R restart), paused label. State-driven via the
 * bus `state` event; shown/hidden through a `.hidden` class over a
 * semi-transparent dark backdrop.
 */
import type { EventBus } from '../core/bus';
import type { AppState, GameEvents } from '../core/run-controller';

/**
 * Overlay screens.
 * Pre: constructed once at boot with the app bus.
 * Post: exactly one overlay visible per app state; the game-over screen
 *       shows the stashed final score (last `score` event).
 */
export class Screens {
  private readonly startEl: HTMLElement;
  private readonly gameOverEl: HTMLElement;
  private readonly pausedEl: HTMLElement;
  private readonly finalScore: HTMLElement;
  private lastScore = 0;

  constructor(bus: EventBus<GameEvents>) {
    this.startEl = this.overlay('start', [
      'CAPTAIN CARGO X',
      '←→ / A D — steer · ↑↓ / W S — altitude · SPACE — fire',
      'P — pause · R — restart',
      'ENTER — launch',
    ]);
    this.gameOverEl = this.overlay('gameover', ['GAME OVER']);
    this.finalScore = document.createElement('div');
    this.finalScore.className = 'final-score';
    this.gameOverEl.appendChild(this.finalScore);
    const hint = document.createElement('div');
    hint.className = 'hint';
    hint.textContent = 'R — restart';
    this.gameOverEl.appendChild(hint);
    this.pausedEl = this.overlay('paused', ['PAUSED — P']);
    document.body.append(this.startEl, this.gameOverEl, this.pausedEl);

    bus.on('score', (total) => {
      this.lastScore = total;
    });
    bus.on('state', (state) => this.show(state));
    this.show('menu');
  }

  private overlay(className: string, lines: string[]): HTMLElement {
    const el = document.createElement('div');
    el.className = `screen ${className}`;
    for (const [i, line] of lines.entries()) {
      const div = document.createElement('div');
      if (i === 0) div.className = 'title';
      else div.className = 'line';
      div.textContent = line;
      el.appendChild(div);
    }
    return el;
  }

  /** One overlay per state (spec/hud.md screens rows). */
  private show(state: AppState): void {
    this.startEl.classList.toggle('hidden', state !== 'menu');
    this.gameOverEl.classList.toggle('hidden', state !== 'gameover');
    this.pausedEl.classList.toggle('hidden', state !== 'paused');
    if (state === 'gameover') this.finalScore.textContent = String(this.lastScore);
  }
}
