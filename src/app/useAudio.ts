import { useEffect } from 'react';
import { createAudioEngine } from '../audio/engine';
import { plasmaLink } from '../audio/plasmaLink';
import { thrusterLink } from '../audio/thrusterLink';
import { typingLink } from '../audio/typingLink';
import { wireAudio } from '../audio/wireAudio';
import type { JourneyStore } from '../store/journey';

/**
 * Creates the audio engine (started by Begin) and connects it to the store and the scene:
 * the plasma level in, a hiss for each thruster pulse and a tick for each typed character.
 */
export function useAudio(store: JourneyStore): void {
  useEffect(() => {
    const engine = createAudioEngine();
    const unwire = wireAudio(store, engine);
    plasmaLink.set = engine.setPlasma;
    thrusterLink.fire = () => {
      engine.hiss();
    };
    typingLink.reveal = (char, now) => {
      engine.tick(char, now);
    };
    return () => {
      typingLink.reveal = () => undefined;
      plasmaLink.set = () => undefined;
      thrusterLink.fire = () => undefined;
      unwire();
      engine.dispose();
    };
  }, [store]);
}
