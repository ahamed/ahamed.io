import { useEffect } from 'react';
import { createAudioEngine } from '../audio/engine';
import { wireBlip } from '../audio/wireBlip';
import type { JourneyStore } from '../store/journey';

/** Creates the audio engine (unlocked by the first gesture) and wires the dialog blip. */
export function useAudio(store: JourneyStore): void {
  useEffect(() => {
    const engine = createAudioEngine();
    const unwire = wireBlip(store, engine);
    return () => {
      unwire();
      engine.dispose();
    };
  }, [store]);
}
