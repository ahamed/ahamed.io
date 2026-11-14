import type { JourneyStore } from '../store/journey';
import type { AudioEngine } from './engine';

/**
 * Connects the journey store to the audio engine: Begin starts it (inside the click, so the
 * browser allows sound), mute follows the store, and each newly opened dialog blips.
 */
export function wireAudio(store: JourneyStore, engine: AudioEngine): () => void {
  const offStart = engine.onStart(() => {
    store.getState().setAudioUnlocked();
  });
  engine.setMuted(store.getState().muted);
  const offStore = store.subscribe((state, prev) => {
    if (state.muted !== prev.muted) engine.setMuted(state.muted);
    if (prev.phase === 'boot' && state.phase !== 'boot') engine.start();
    if (state.openStopId !== null && state.openStopId !== prev.openStopId) engine.blip();
  });
  return () => {
    offStart();
    offStore();
  };
}
