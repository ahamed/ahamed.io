import { useEffect } from 'react';
import type { Stop } from '../content/schema';
import { autoplayNext, dwellMs } from '../journey/autoplay';
import type { JourneyStore } from '../store/journey';

/** Extra time allowed for a flight before autoplay moves on without its dialog opening. */
export const FALLBACK_MS = 6000;
const EPSILON = 1e-6;

/**
 * Drives autoplay: at each stop it waits for the dialog to open, dwells for its typing and
 * reading time, then flies on; after the last stop it flies into the finale and turns itself
 * off there. Timers only, no frame loop. Manual input turns autoplay off in the store.
 */
export function useAutoplay(
  store: JourneyStore,
  stops: readonly Stop[],
  closePoints: readonly number[],
): void {
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    /** The stop autoplay is flying to (its dialog starts the dwell), or 'end'. */
    let expected: string | null = null;

    const schedule = (ms: number, fn: () => void) => {
      clearTimeout(timer);
      timer = setTimeout(fn, ms);
    };
    const stopAt = (target: number) =>
      closePoints.findIndex((cp) => Math.abs(cp - target) < EPSILON);

    const dwellThenAdvance = (stop: Stop) => {
      expected = null;
      schedule(dwellMs(stop.text), advance);
    };

    function advance() {
      const state = store.getState();
      if (!state.autoplay) return;
      const next = autoplayNext(state.target, closePoints);
      if (next === null) {
        state.toggleAutoplay();
        return;
      }
      state.autoplayTo(next, performance.now());
      const stop = stops[stopAt(next)];
      expected = stop ? stop.id : 'end';
      // If the dialog never opens (a tiny screen), move on after its dwell anyway.
      schedule(FALLBACK_MS + (stop ? dwellMs(stop.text) : 0), stop ? advance : turnOff);
    }

    function turnOff() {
      const state = store.getState();
      if (state.autoplay) state.toggleAutoplay();
    }

    const startHere = () => {
      const state = store.getState();
      const open = stops.find((s) => s.id === state.openStopId);
      const index = open ? stops.indexOf(open) : -1;
      const parked = index >= 0 && Math.abs((closePoints[index] ?? -1) - state.target) < EPSILON;
      if (open && parked) dwellThenAdvance(open);
      else advance();
    };

    const off = store.subscribe((state, prev) => {
      if (!state.autoplay) {
        if (prev.autoplay) {
          clearTimeout(timer);
          expected = null;
        }
        return;
      }
      if (!prev.autoplay) {
        startHere();
        return;
      }
      if (expected === 'end' && state.finaleShown) {
        turnOff();
        return;
      }
      if (state.openStopId !== prev.openStopId && state.openStopId === expected) {
        const stop = stops.find((s) => s.id === expected);
        if (stop) dwellThenAdvance(stop);
      }
    });
    return () => {
      off();
      clearTimeout(timer);
    };
  }, [store, stops, closePoints]);
}
