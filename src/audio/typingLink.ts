/**
 * Hands each character the typewriter reveals from the dialog (UI) to the audio engine (owned by
 * the app), without the UI importing audio code. `useAudio` points `reveal` at the tick gate.
 */
export const typingLink: { reveal: (char: string, now: number) => void } = {
  reveal: () => undefined,
};
