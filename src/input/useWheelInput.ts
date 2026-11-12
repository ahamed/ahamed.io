import { useEffect } from 'react';
import { pixelsToProgress, wheelToPixels } from '../journey/input';
import type { JourneyStore } from '../store/journey';

/** Wheel/trackpad scrolling drives the voyage; the page itself never scrolls. */
export function useWheelInput(store: JourneyStore, stopCount: number): void {
  useEffect(() => {
    const onWheel = (event: WheelEvent) => {
      const px = wheelToPixels(event, window.innerHeight);
      if (px === 0) return;
      event.preventDefault();
      store
        .getState()
        .nudge(pixelsToProgress(px, window.innerHeight, stopCount), performance.now());
    };
    window.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      window.removeEventListener('wheel', onWheel);
    };
  }, [store, stopCount]);
}
