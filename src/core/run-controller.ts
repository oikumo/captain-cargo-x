/**
 * Game state machine + input→run orchestration — controller layer
 * (methodology §9 states: Menu/Playing/Paused/GameOver; §8 intents). Also
 * the RunSink bridge: model moments become bus events for HUD/FX. No three,
 * no DOM (methodology §5 controller rows).
 */
import type { EventBus } from './bus';
import type { InputMap } from './input';
import type { BoomEvent, RunSink } from '../game/events';
import type { RunModel } from '../game/run';

export type AppState = 'menu' | 'playing' | 'paused' | 'gameover';

/** Bus vocabulary for UI/FX consumers (HUD owns no game state). */
export interface GameEvents extends Record<string, unknown> {
  score: number;
  lives: number;
  state: AppState;
  boom: BoomEvent;
}

/**
 * Owns the app state machine and pumps the run while playing.
 * Pre: constructed once at boot with injected bus/input/run partners.
 * Post: exactly one `state` bus event per transition; the run advances
 *       only in 'playing'; every restart re-seeds deterministically.
 */
export class GameController implements RunSink {
  private appState: AppState = 'menu';
  private seed = 1337;

  constructor(
    private readonly bus: EventBus<GameEvents>,
    private readonly input: InputMap,
    private readonly run: RunModel,
  ) {}

  get state(): AppState {
    return this.appState;
  }

  // -- RunSink bridge (model → bus) ------------------------------------------

  onScore(total: number): void {
    this.bus.emit('score', total);
  }

  onLives(left: number): void {
    this.bus.emit('lives', left);
  }

  onBoom(e: BoomEvent): void {
    this.bus.emit('boom', e);
  }

  onGameOver(): void {
    this.transition('gameover');
  }

  // -- frame pump --------------------------------------------------------------

  /**
   * One frame of state-machine + input routing.
   * Pre: `dt` clamped seconds (from the GameLoop).
   * Post: edge actions consumed; axes written into `run.input` only while
   *       playing; restart re-seeds (`seed + 1`) and transitions to playing.
   */
  update(dt: number): void {
    switch (this.appState) {
      case 'menu':
        if (this.input.consume('confirm')) this.beginRun();
        break;
      case 'playing':
        if (this.input.consume('pause')) {
          this.transition('paused');
          break;
        }
        if (this.input.consume('restart')) {
          this.beginRun();
          break;
        }
        this.pumpRun(dt);
        break;
      case 'paused':
        if (this.input.consume('pause')) this.transition('playing');
        else if (this.input.consume('restart')) this.beginRun();
        break;
      case 'gameover':
        if (this.input.consume('restart') || this.input.consume('confirm')) this.beginRun();
        break;
    }
  }

  private pumpRun(dt: number): void {
    const left = this.input.isDown('left') ? 1 : 0;
    const right = this.input.isDown('right') ? 1 : 0;
    const up = this.input.isDown('up') ? 1 : 0;
    const down = this.input.isDown('down') ? 1 : 0;
    this.run.input.steer = left - right;
    this.run.input.climb = up - down;
    this.run.input.fire = this.input.isDown('fire');
    this.run.update(dt);
  }

  private beginRun(): void {
    this.seed++;
    this.run.start(this.seed);
    this.transition('playing');
  }

  private transition(next: AppState): void {
    this.appState = next;
    this.bus.emit('state', next);
  }
}
