import { describe, expect, it, vi } from 'vitest';
import { EventBus } from '../../src/core/bus';

describe('EventBus', () => {
  it('publishes an event to every subscriber once, with the payload', () => {
    type E = { score: number; boom: { x: number; kind: string } };
    const bus = new EventBus<E>();
    const a = vi.fn();
    const b = vi.fn();
    bus.on('score', a);
    bus.on('score', b);
    bus.on('boom', a);

    bus.emit('score', 300);
    expect(a).toHaveBeenCalledWith(300);
    expect(a).toHaveBeenCalledTimes(1); // only the score handler ran
    expect(b).toHaveBeenCalledTimes(1);
  });

  it('off() disconnects a listener', () => {
    const bus = new EventBus<{ lives: number }>();
    const fn = vi.fn();
    const off = bus.on('lives', fn);
    bus.emit('lives', 5);
    off();
    bus.emit('lives', 4);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('emitting an event with no listeners is a no-op (never throws)', () => {
    const bus = new EventBus<{ nothing: void }>();
    expect(() => bus.emit('nothing', undefined)).not.toThrow();
  });
});
