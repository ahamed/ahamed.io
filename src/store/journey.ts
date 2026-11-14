import { useStore } from 'zustand';
import { createStore } from 'zustand/vanilla';
import { STOPS } from '../content/journey';
import { ARROW_STEP_FRACTION } from '../journey/input';
import { applyDelta, clampProgress } from '../journey/progress';
import { buildRoute } from '../journey/route';
import { neighbourTarget } from '../journey/stops';

export interface JourneyState {
  /** Where input wants the voyage to be (0..1). The shown position eases toward it. */
  target: number;
  /** `performance.now()` of the last user input, for the snap idle check. */
  lastInputAt: number;
  openStopId: string | null;
  audioUnlocked: boolean;
  /** A running "Back to Earth" rewind, or null. Any input cancels it. */
  flight: Flight | null;
  /** Whether the finale's caption and contact card are showing. */
  finaleShown: boolean;
  nudge: (delta: number, now: number) => void;
  step: (dir: 1 | -1, now: number) => void;
  goToStop: (dir: 1 | -1, now: number) => void;
  goToStart: (now: number) => void;
  goToEnd: (now: number) => void;
  snapTo: (target: number) => void;
  setOpenStop: (id: string | null) => void;
  setAudioUnlocked: () => void;
  /** Starts the rewind to the start; under reduced motion jumps there instead. */
  flyBack: (now: number, reduced: boolean) => void;
  /** Moves the target for the rewind; counts as input so snapping waits. */
  flyTo: (target: number, now: number) => void;
  endFlight: () => void;
  setFinaleShown: (shown: boolean) => void;
  /** Boot panel, then the intro sweep, then the voyage. Voyage input is ignored while booting. */
  phase: Phase;
  /** `performance.now()` when the intro sweep started. */
  introStartAt: number;
  /** Leaves the boot panel; `silent` starts muted, `reduced` skips the intro sweep. */
  begin: (now: number, options: { silent: boolean; reduced: boolean }) => void;
  endIntro: () => void;
  /** Whether all sound is muted; remembered across visits. */
  muted: boolean;
  toggleMute: () => void;
  /** Whether autoplay is hopping from stop to stop. Any voyage input turns it off. */
  autoplay: boolean;
  toggleAutoplay: () => void;
  /** Moves the target for autoplay without counting as manual input that stops it. */
  autoplayTo: (target: number, now: number) => void;
}

export type Phase = 'boot' | 'intro' | 'voyage';

/** The part of `Storage` the store needs, so tests can pass a fake. */
export interface KeyValueStorage {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
}

interface Options {
  phase?: Phase;
  storage?: KeyValueStorage | null;
}

const MUTED_KEY = 'voyage:muted';

function browserStorage(): KeyValueStorage | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null;
  }
}

function readMuted(storage: KeyValueStorage | null): boolean {
  try {
    return storage?.getItem(MUTED_KEY) === '1';
  } catch {
    return false;
  }
}

function writeMuted(storage: KeyValueStorage | null, muted: boolean): void {
  try {
    storage?.setItem(MUTED_KEY, muted ? '1' : '0');
  } catch {
    // Storage blocked: mute still works for this session.
  }
}

export interface Flight {
  /** Target progress when the rewind started. */
  from: number;
  /** `performance.now()` when it started. */
  startAt: number;
}

export function createJourneyStore(
  closePoints: readonly number[],
  { phase = 'boot', storage = browserStorage() }: Options = {},
) {
  const gaps = closePoints.slice(1).map((cp, i) => cp - (closePoints[i] ?? 0));
  const meanGap = gaps.length ? gaps.reduce((a, b) => a + b, 0) / gaps.length : 1;
  const stepSize = meanGap * ARROW_STEP_FRACTION;

  return createStore<JourneyState>()((set, get) => {
    /**
     * Gate for voyage input: false while booting; ends the intro sweep at once otherwise.
     * Manual input also stops a rewind and autoplay (the callers set those fields).
     */
    const accept = (): boolean => {
      const current = get().phase;
      if (current === 'boot') return false;
      if (current === 'intro') set({ phase: 'voyage' });
      return true;
    };
    const manual = { flight: null, autoplay: false } as const;

    return {
      target: 0,
      lastInputAt: 0,
      openStopId: null,
      audioUnlocked: false,
      flight: null,
      finaleShown: false,
      nudge: (delta, now) => {
        if (!accept()) return;
        set({ target: applyDelta(get().target, delta), lastInputAt: now, ...manual });
      },
      step: (dir, now) => {
        get().nudge(dir * stepSize, now);
      },
      goToStop: (dir, now) => {
        if (!accept()) return;
        set({
          target: neighbourTarget(get().target, closePoints, dir),
          lastInputAt: now,
          ...manual,
        });
      },
      goToStart: (now) => {
        if (!accept()) return;
        set({ target: 0, lastInputAt: now, ...manual });
      },
      goToEnd: (now) => {
        if (!accept()) return;
        set({ target: 1, lastInputAt: now, ...manual });
      },
      snapTo: (target) => {
        set({ target: clampProgress(target) });
      },
      setOpenStop: (id) => {
        if (get().openStopId !== id) set({ openStopId: id });
      },
      setAudioUnlocked: () => {
        set({ audioUnlocked: true });
      },
      flyBack: (now, reduced) => {
        if (!accept()) return;
        if (reduced) {
          journeyRuntime.position = 0;
          set({ target: 0, lastInputAt: now, ...manual });
          return;
        }
        set({ flight: { from: get().target, startAt: now }, lastInputAt: now, autoplay: false });
      },
      flyTo: (target, now) => {
        set({ target: clampProgress(target), lastInputAt: now });
      },
      endFlight: () => {
        if (get().flight) set({ flight: null });
      },
      setFinaleShown: (shown) => {
        if (get().finaleShown !== shown) set({ finaleShown: shown });
      },
      phase,
      introStartAt: 0,
      begin: (now, { silent, reduced }) => {
        if (get().phase !== 'boot') return;
        if (silent) writeMuted(storage, true);
        set({
          phase: reduced ? 'voyage' : 'intro',
          introStartAt: now,
          muted: silent || get().muted,
        });
      },
      endIntro: () => {
        if (get().phase === 'intro') set({ phase: 'voyage' });
      },
      muted: readMuted(storage),
      toggleMute: () => {
        const muted = !get().muted;
        writeMuted(storage, muted);
        set({ muted });
      },
      autoplay: false,
      toggleAutoplay: () => {
        if (get().phase !== 'voyage' && !get().autoplay) return;
        set({ autoplay: !get().autoplay });
      },
      autoplayTo: (target, now) => {
        set({ target: clampProgress(target), lastInputAt: now, flight: null });
      },
    };
  });
}

export type JourneyStore = ReturnType<typeof createJourneyStore>;

export const ROUTE = buildRoute(STOPS);

export const journeyStore = createJourneyStore(ROUTE.closePoints);

export const useJourney = <T>(selector: (state: JourneyState) => T): T =>
  useStore(journeyStore, selector);

/** Per-frame values mutated in the render loop (never React state). */
export const journeyRuntime = {
  /** Eased progress shown on screen (0..1). */
  position: 0,
  /** How fast `position` is moving, in progress per second (0 at rest). */
  speed: 0,
};
