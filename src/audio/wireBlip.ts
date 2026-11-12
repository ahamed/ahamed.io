import type { JourneyStore } from '../store/journey';
import type { AudioEngine } from './engine';

/** Plays the blip whenever a dialog opens, and mirrors the engine's unlock into the store. */
export function wireBlip(store: JourneyStore, engine: AudioEngine): () => void {
  const offUnlock = engine.onUnlock(() => {
    store.getState().setAudioUnlocked();
  });
  const offStore = store.subscribe((state, prev) => {
    if (state.openStopId !== null && state.openStopId !== prev.openStopId) engine.blip();
  });
  return () => {
    offUnlock();
    offStore();
  };
}
