import { afterEach, describe, expect, it, vi } from 'vitest';
import { createAudioEngine, type AudioEngine } from './engine';
import { createFakeAudioContext } from '../test/fakeAudio';

let engine: AudioEngine | undefined;
afterEach(() => engine?.dispose());

function setup() {
  const fake = createFakeAudioContext();
  const createContext = vi.fn(() => fake.ctx);
  engine = createAudioEngine({ createContext, target: window });
  return { ...fake, createContext, engine };
}

describe('audio engine', () => {
  it('creates no AudioContext and plays nothing before a gesture', () => {
    const { createContext, engine, calls } = setup();
    expect(engine.isUnlocked()).toBe(false);
    expect(engine.blip()).toBe(false);
    expect(createContext).not.toHaveBeenCalled();
    expect(calls).toHaveLength(0);
  });

  it.each([
    ['keydown', () => new KeyboardEvent('keydown', { key: 'a' })],
    ['pointerdown', () => new Event('pointerdown')],
    ['touchstart', () => new Event('touchstart')],
  ])('unlocks on %s', (_name, makeEvent) => {
    const { engine, calls } = setup();
    window.dispatchEvent(makeEvent());
    expect(engine.isUnlocked()).toBe(true);
    expect(calls.some((c) => c.method === 'resume')).toBe(true);
    expect(engine.blip()).toBe(true);
  });

  it('does not unlock on wheel', () => {
    const { engine } = setup();
    window.dispatchEvent(new WheelEvent('wheel', { deltaY: 100 }));
    expect(engine.isUnlocked()).toBe(false);
  });

  it('drops a blip requested before unlock instead of queueing it', () => {
    const { engine, calls } = setup();
    engine.blip();
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'a' }));
    expect(calls.filter((c) => c.method === 'start')).toHaveLength(0);
  });

  it('notifies listeners when unlocked', () => {
    const { engine } = setup();
    const listener = vi.fn();
    engine.onUnlock(listener);
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'a' }));
    expect(listener).toHaveBeenCalledOnce();
  });
});
