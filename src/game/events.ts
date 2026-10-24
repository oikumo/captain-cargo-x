/**
 * Run-model event vocabulary — model-layer types only (no three, no DOM).
 * The controller bridges these into the typed bus for HUD/FX consumers
 * (partner seam per doc/omt-ts-methodology.md §6); views/HUD never reach
 * into the model directly for these moments.
 */

/** FX event kinds — one pooled boom table on the view side. */
export type BoomKind =
  | 'jet'
  | 'drone'
  | 'gunship'
  | 'shield-hit'
  | 'shield-break'
  | 'dome-destroy'
  | 'shell'
  | 'splash';

export interface BoomEvent {
  x: number;
  y: number;
  z: number;
  kind: BoomKind;
}

/**
 * Sink implemented by the controller (bus adapter). All methods optional —
 * a recording sink in tests may implement only what it inspects.
 */
export interface RunSink {
  /** Total score after an awarding moment. */
  onScore?(total: number): void;
  /** Lives remaining after a life change. */
  onLives?(left: number): void;
  /** Run ended (0 lives) — fired exactly once per run. */
  onGameOver?(): void;
  /** World-space FX moment (explosion / burst / splash). */
  onBoom?(e: BoomEvent): void;
}
