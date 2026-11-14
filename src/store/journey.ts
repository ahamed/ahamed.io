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
}

export interface Flight {
  /** Target progress when the rewind started. */
  from: number;
  /** `performance.now()` when it started. */
  startAt: number;
}

export function createJourneyStore(closePoints: readonly number[]) {
  const gaps = closePoints.slice(1).map((cp, i) => cp - (closePoints[i] ?? 0));
  const meanGap = gaps.length ? gaps.reduce((a, b) => a + b, 0) / gaps.length : 1;
  const stepSize = meanGap * ARROW_STEP_FRACTION;

  return createStore<JourneyState>()((set, get) => ({
    target: 0,
    lastInputAt: 0,
    openStopId: null,
    audioUnlocked: false,
    flight: null,
    finaleShown: false,
    nudge: (delta, now) => {
      set({ target: applyDelta(get().target, delta), lastInputAt: now, flight: null });
    },
    step: (dir, now) => {
      get().nudge(dir * stepSize, now);
    },
    goToStop: (dir, now) => {
      set({
        target: neighbourTarget(get().target, closePoints, dir),
        lastInputAt: now,
        flight: null,
      });
    },
    goToStart: (now) => {
      set({ target: 0, lastInputAt: now, flight: null });
    },
    goToEnd: (now) => {
      set({ target: 1, lastInputAt: now, flight: null });
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
      if (reduced) {
        journeyRuntime.position = 0;
        set({ target: 0, lastInputAt: now, flight: null });
        return;
      }
      set({ flight: { from: get().target, startAt: now }, lastInputAt: now });
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
  }));
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
