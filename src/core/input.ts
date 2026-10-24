/**
 * Input state map — controller layer (methodology §8: raw keys are parsed
 * into actions; the DOM wiring lives in main.ts, this class stays pure).
 */
export type InputAction =
  | 'left'
  | 'right'
  | 'up'
  | 'down'
  | 'fire'
  | 'confirm'
  | 'restart'
  | 'pause';

/**
 * Held-state + one-shot edge tracking for the action set.
 * Pre: fed by the platform layer (keydown/keyup); key-repeat storms may
 *      call `press` repeatedly — edges stay single-shot.
 * Post: `isDown` reflects the hold; `consume` drains an edge exactly once;
 *       `release` clears both (menus losing focus never leave ghosts).
 */
export class InputMap {
  private readonly down = new Set<InputAction>();
  private readonly edges = new Set<InputAction>();

  press(action: InputAction): void {
    this.down.add(action);
    this.edges.add(action);
  }

  release(action: InputAction): void {
    this.down.delete(action);
    this.edges.delete(action);
  }

  isDown(action: InputAction): boolean {
    return this.down.has(action);
  }

  /** One-shot edge: true at most once per press, then drained. */
  consume(action: InputAction): boolean {
    if (!this.edges.has(action)) return false;
    this.edges.delete(action);
    return true;
  }

  /** Wipe everything (window blur / state exits). */
  clear(): void {
    this.down.clear();
    this.edges.clear();
  }
}
