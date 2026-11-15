import { useEffect } from 'react';
import { createAudioEngine } from '../audio/engine';
import { plasmaLink } from '../audio/plasmaLink';
import { thrusterLink } from '../audio/thrusterLink';
import { wireAudio } from '../audio/wireAudio';
import type { JourneyStore } from '../store/journey';

/**
 * Creates the audio engine (started by Begin) and connects it to the store and the scene:
 * the plasma level in, and a hiss for each thruster pulse.
 */
export function useAudio(store: JourneyStore): void {
  useEffect(() => {
    const engine = createAudioEngine();
    const unwire = wireAudio(store, engine);
    plasmaLink.set = engine.setPlasma;
    thrusterLink.fire = () => {
      engine.hiss();
    };
    return () => {
      plasmaLink.set = () => undefined;
      thrusterLink.fire = () => undefined;
      unwire();
      engine.dispose();
    };
  }, [store]);
}
