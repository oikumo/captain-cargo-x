/**
 * Implements spec/hud.md — the DOM HUD + overlay screens. Reacts to bus
 * events (`score`, `lives`, `state`) only; the HUD holds no game state.
 * Pure DOM, pointer-events none, no three (UI/HUD layer rule).
 */
import type { AppState, GameEvents } from '../core/run-controller';
import type { EventBus } from '../core/bus';

const SCREEN_FOR: Record<AppState, string | null> = {
  menu: 'screen-start',
  playing: null,
  paused: 'screen-pause',
  gameover: 'screen-over',
};

/**
 * HUD + screens binder for one boot.
 * Pre: `#hud` (lives bars / ship icon / score) and `#screens` (three
 *      `.screen` overlays + a `.final` score span) exist in the document.
 * Post: subscriptions live as long as the engine loop; repaints are instant
 *       (spec: no exit anims; score jumps render nearly instantly).
 */
export class Hud {
  private readonly screens: HTMLElement;
  private lastScore = 0;

  constructor(bus: EventBus<GameEvents>, hudRoot: HTMLElement, screens: HTMLElement) {
    this.screens = screens;
    const scoreEl = hudRoot.querySelector<HTMLElement>('#hud-score');
    const finalEl = screens.querySelector<HTMLElement>('.final');
    const bars = Array.from(hudRoot.querySelectorAll<HTMLElement>('.lives .bar'));

    bus.on('score', (n) => {
      this.lastScore = n;
      if (scoreEl) scoreEl.textContent = String(n);
    });
    bus.on('lives', (n) => {
      for (let i = 0; i < bars.length; i++) {
        bars[i].style.opacity = i < n ? '1' : '0.25'; // lost bars dim, no anim
      }
    });
    bus.on('state', (s) => {
      hudRoot.classList.toggle('dimmed', s === 'paused');
      this.showScreen(SCREEN_FOR[s]);
      if (s === 'gameover' && finalEl) finalEl.textContent = String(this.lastScore);
    });
  }

  /** Exactly one `.screen` visible per state; null hides all. */
  private showScreen(id: string | null): void {
    this.screens.querySelectorAll<HTMLElement>('.screen').forEach((el) => {
      el.classList.toggle('hidden', el.id !== id);
    });
  }
}
