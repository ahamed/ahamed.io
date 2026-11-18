import { describe, expect, it, vi } from 'vitest';
import { createJourneyStore } from '../store/journey';
import type { AudioEngine } from './engine';
import { wireAudio } from './wireAudio';

function fakeEngine() {
  let startListener: (() => void) | undefined;
  let started = false;
  const engine = {
    isStarted: () => started,
    start: vi.fn(() => {
      started = true;
      startListener?.();
    }),
    blip: vi.fn(() => started),
    hiss: vi.fn(() => started),
    tick: vi.fn(() => started),
    setMuted: vi.fn(),
    setPlasma: vi.fn(),
    onStart: (listener: () => void) => {
      startListener = listener;
      return () => undefined;
    },
    dispose: vi.fn(),
  } satisfies AudioEngine;
  return engine;
}

const boot = () => createJourneyStore([0, 0.8], { storage: null });

describe('wireAudio', () => {
  it('starts the engine when the visitor begins, and marks audio unlocked', () => {
    const store = boot();
    const engine = fakeEngine();
    wireAudio(store, engine);
    expect(engine.start).not.toHaveBeenCalled();
    store.getState().begin(0, { silent: false, reduced: false });
    expect(engine.start).toHaveBeenCalledOnce();
    expect(store.getState().audioUnlocked).toBe(true);
  });

  it('mirrors mute into the engine, from the start and on every toggle', () => {
    const store = boot();
    const engine = fakeEngine();
    wireAudio(store, engine);
    expect(engine.setMuted).toHaveBeenLastCalledWith(false);
    store.getState().begin(0, { silent: true, reduced: false });
    expect(engine.setMuted).toHaveBeenLastCalledWith(true);
    store.getState().toggleMute();
    expect(engine.setMuted).toHaveBeenLastCalledWith(false);
  });

  it('blips once per transition to an open stop', () => {
    const store = boot();
    const engine = fakeEngine();
    wireAudio(store, engine);
    store.getState().begin(0, { silent: false, reduced: true });
    store.getState().setOpenStop('earth');
    store.getState().setOpenStop('earth');
    store.getState().throttle(1, 0.1, 0);
    store.getState().setOpenStop(null);
    store.getState().setOpenStop('moon');
    expect(engine.blip).toHaveBeenCalledTimes(2);
  });

  it('stops listening when disposed', () => {
    const store = boot();
    const engine = fakeEngine();
    const dispose = wireAudio(store, engine);
    dispose();
    store.getState().begin(0, { silent: false, reduced: true });
    store.getState().setOpenStop('moon');
    expect(engine.start).not.toHaveBeenCalled();
    expect(engine.blip).not.toHaveBeenCalled();
  });
});
