/**
 * Hands the plasma level from the scene (which knows the camera) to the audio engine (owned by
 * the app), without the scene importing audio code. `useAudio` points `set` at the engine.
 */
export const plasmaLink: { set: (level: number) => void } = {
  set: () => undefined,
};
