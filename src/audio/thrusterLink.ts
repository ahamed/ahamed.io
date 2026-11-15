/**
 * Hands Voyager's thruster pulses from the scene (which runs the attitude cycle) to the audio
 * engine (owned by the app), without the scene importing audio code. `useAudio` points `fire`
 * at the engine's hiss.
 */
export const thrusterLink: { fire: () => void } = {
  fire: () => undefined,
};
