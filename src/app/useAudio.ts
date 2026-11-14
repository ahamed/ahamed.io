import { useEffect } from 'react';
import { createAudioEngine } from '../audio/engine';
import { plasmaLink } from '../audio/plasmaLink';
import { wireAudio } from '../audio/wireAudio';
import type { JourneyStore } from '../store/journey';

/** Creates the audio engine (started by Begin) and connects it to the store and the scene. */
export function useAudio(store: JourneyStore): void {
  useEffect(() => {
    const engine = createAudioEngine();
    const unwire = wireAudio(store, engine);
    plasmaLink.set = engine.setPlasma;
    return () => {
      plasmaLink.set = () => undefined;
      unwire();
      engine.dispose();
    };
  }, [store]);
}
