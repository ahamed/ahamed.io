import { blipParams, playBlip } from './blip';

const UNLOCK_EVENTS = ['keydown', 'pointerdown', 'touchstart'] as const;

export interface AudioEngine {
  isUnlocked: () => boolean;
  /** Plays the blip if audio is unlocked; returns whether it played. Never queues. */
  blip: () => boolean;
  onUnlock: (listener: () => void) => () => void;
  dispose: () => void;
}

interface Options {
  createContext?: () => AudioContext;
  target?: EventTarget;
}

/** Holds a lazily created AudioContext that is unlocked by the first user gesture. */
export function createAudioEngine({
  createContext = () => new AudioContext(),
  target = window,
}: Options = {}): AudioEngine {
  let ctx: AudioContext | null = null;
  const listeners = new Set<() => void>();
  const params = blipParams();

  const unlock = () => {
    removeListeners();
    ctx ??= createContext();
    void ctx.resume();
    for (const listener of listeners) listener();
  };

  const removeListeners = () => {
    for (const type of UNLOCK_EVENTS) target.removeEventListener(type, unlock, true);
  };

  for (const type of UNLOCK_EVENTS) target.addEventListener(type, unlock, true);

  return {
    isUnlocked: () => ctx !== null,
    blip: () => {
      if (!ctx) return false;
      playBlip(ctx, params);
      return true;
    },
    onUnlock: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    dispose: () => {
      removeListeners();
      listeners.clear();
    },
  };
}
