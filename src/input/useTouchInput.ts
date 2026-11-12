import { useEffect, type RefObject } from 'react';
import { pixelsToProgress } from '../journey/input';
import type { JourneyStore } from '../store/journey';

/** Vertical swipes on the voyage surface: swipe up moves forward. */
export function useTouchInput(
  store: JourneyStore,
  surface: RefObject<HTMLElement | null>,
  stopCount: number,
): void {
  useEffect(() => {
    const element = surface.current;
    if (!element) return;
    let lastY: number | null = null;

    const onStart = (event: TouchEvent) => {
      lastY = event.touches[0]?.clientY ?? null;
    };
    const onMove = (event: TouchEvent) => {
      const y = event.touches[0]?.clientY;
      if (y === undefined || lastY === null) return;
      const dy = lastY - y;
      lastY = y;
      store
        .getState()
        .nudge(pixelsToProgress(dy, window.innerHeight, stopCount), performance.now());
    };
    const onEnd = () => {
      lastY = null;
    };

    element.addEventListener('touchstart', onStart, { passive: true });
    element.addEventListener('touchmove', onMove, { passive: true });
    element.addEventListener('touchend', onEnd);
    element.addEventListener('touchcancel', onEnd);
    return () => {
      element.removeEventListener('touchstart', onStart);
      element.removeEventListener('touchmove', onMove);
      element.removeEventListener('touchend', onEnd);
      element.removeEventListener('touchcancel', onEnd);
    };
  }, [store, surface, stopCount]);
}
