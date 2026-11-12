import { describe, expect, it, vi } from 'vitest';
import { createJourneyStore } from '../store/journey';
import type { AudioEngine } from './engine';
import { wireBlip } from './wireBlip';

function fakeEngine() {
  let unlockListener: (() => void) | undefined;
  let unlocked = false;
  const engine: AudioEngine = {
    isUnlocked: () => unlocked,
    blip: vi.fn(() => unlocked),
    onUnlock: (listener) => {
      unlockListener = listener;
      return () => undefined;
    },
    dispose: vi.fn(),
  };
  const unlock = () => {
    unlocked = true;
    unlockListener?.();
  };
  return { engine, unlock };
}

describe('wireBlip', () => {
  it('marks audio unlocked in the store when the engine unlocks', () => {
    const store = createJourneyStore([0, 0.8]);
    const { engine, unlock } = fakeEngine();
    wireBlip(store, engine);
    unlock();
    expect(store.getState().audioUnlocked).toBe(true);
  });

  it('blips once per transition to an open stop', () => {
    const store = createJourneyStore([0, 0.8]);
    const { engine, unlock } = fakeEngine();
    wireBlip(store, engine);
    unlock();
    store.getState().setOpenStop('earth');
    store.getState().setOpenStop('earth');
    store.getState().nudge(0.01, 0);
    store.getState().setOpenStop(null);
    store.getState().setOpenStop('moon');
    expect(engine.blip).toHaveBeenCalledTimes(2);
  });

  it('does not blip when a dialog closes', () => {
    const store = createJourneyStore([0, 0.8]);
    const { engine, unlock } = fakeEngine();
    store.getState().setOpenStop('earth');
    wireBlip(store, engine);
    unlock();
    store.getState().setOpenStop(null);
    expect(engine.blip).not.toHaveBeenCalled();
  });

  it('stops listening when disposed', () => {
    const store = createJourneyStore([0, 0.8]);
    const { engine, unlock } = fakeEngine();
    const dispose = wireBlip(store, engine);
    unlock();
    dispose();
    store.getState().setOpenStop('moon');
    expect(engine.blip).not.toHaveBeenCalled();
  });
});
