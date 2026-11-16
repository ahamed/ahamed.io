import { useEffect } from 'react';
import { wheelToPixels } from '../journey/input';
import { eventRate, wheelIntensity } from '../journey/throttle';
import type { JourneyStore } from '../store/journey';

/** Wheel/trackpad scrolling holds the throttle; the page itself never scrolls. */
export function useWheelInput(store: JourneyStore): void {
  useEffect(() => {
    let lastAt = -Infinity;
    const onWheel = (event: WheelEvent) => {
      const px = wheelToPixels(event, window.innerHeight);
      if (px === 0) return;
      event.preventDefault();
      const now = performance.now();
      const intensity = wheelIntensity(eventRate(px, now - lastAt));
      lastAt = now;
      store.getState().throttle(px > 0 ? 1 : -1, intensity, now);
    };
    window.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      window.removeEventListener('wheel', onWheel);
    };
  }, [store]);
}
