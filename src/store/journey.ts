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
  nudge: (delta: number, now: number) => void;
  step: (dir: 1 | -1, now: number) => void;
  goToStop: (dir: 1 | -1, now: number) => void;
  goToStart: (now: number) => void;
  goToEnd: (now: number) => void;
  snapTo: (target: number) => void;
  setOpenStop: (id: string | null) => void;
  setAudioUnlocked: () => void;
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
    nudge: (delta, now) => {
      set({ target: applyDelta(get().target, delta), lastInputAt: now });
    },
    step: (dir, now) => {
      get().nudge(dir * stepSize, now);
    },
    goToStop: (dir, now) => {
      set({ target: neighbourTarget(get().target, closePoints, dir), lastInputAt: now });
    },
    goToStart: (now) => {
      set({ target: 0, lastInputAt: now });
    },
    goToEnd: (now) => {
      set({ target: 1, lastInputAt: now });
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
  }));
}

export type JourneyStore = ReturnType<typeof createJourneyStore>;

export const ROUTE = buildRoute(STOPS);

export const journeyStore = createJourneyStore(ROUTE.closePoints);

export const useJourney = <T>(selector: (state: JourneyState) => T): T =>
  useStore(journeyStore, selector);

/** Per-frame values mutated in the render loop (never React state). */
export const journeyRuntime = { position: 0 };
