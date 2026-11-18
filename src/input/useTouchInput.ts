import { useEffect, type RefObject } from 'react';
import { eventRate, wheelIntensity } from '../journey/throttle';
import type { JourneyStore } from '../store/journey';

/** Vertical swipes on the voyage surface hold the throttle: swipe up moves forward. */
export function useTouchInput(store: JourneyStore, surface: RefObject<HTMLElement | null>): void {
  useEffect(() => {
    const element = surface.current;
    if (!element) return;
    let lastY: number | null = null;
    let lastAt = -Infinity;

    const onStart = (event: TouchEvent) => {
      lastY = event.touches[0]?.clientY ?? null;
      lastAt = performance.now();
    };
    const onMove = (event: TouchEvent) => {
      const y = event.touches[0]?.clientY;
      if (y === undefined || lastY === null) return;
      const dy = lastY - y;
      lastY = y;
      if (dy === 0) return;
      const now = performance.now();
      const intensity = wheelIntensity(eventRate(dy, now - lastAt));
      lastAt = now;
      store.getState().throttle(dy > 0 ? 1 : -1, intensity, now);
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
  }, [store, surface]);
}
