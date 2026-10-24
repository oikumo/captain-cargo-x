/**
 * Typed event bus — controller layer (methodology §5: the bus is core
 * glue; HUD/FX subscribe, the model never imports it). Zero dependencies,
 * no DOM, no three.
 */

/**
 * Minimal typed pub/sub.
 * Pre: `E` maps event names to payload types.
 * Post: `on` returns an unsubscribe fn; `emit` with no subscribers is a
 *       no-op; listeners may be added/removed during emit safely enough
 *       for the game's fan-outs (snapshot iteration).
 */
export class EventBus<E extends Record<string, unknown>> {
  private readonly listeners = new Map<keyof E, Array<(payload: unknown) => void>>();

  on<K extends keyof E>(key: K, fn: (payload: E[K]) => void): () => void {
    const list = this.listeners.get(key) ?? [];
    list.push(fn as (payload: unknown) => void);
    this.listeners.set(key, list);
    return () => {
      const current = this.listeners.get(key);
      if (!current) return;
      const i = current.indexOf(fn as (payload: unknown) => void);
      if (i >= 0) current.splice(i, 1);
    };
  }

  emit<K extends keyof E>(key: K, payload: E[K]): void {
    const list = this.listeners.get(key);
    if (!list) return;
    for (const fn of [...list]) fn(payload);
  }
}
