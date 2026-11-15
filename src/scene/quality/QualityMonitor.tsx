import { PerformanceMonitor } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import { useEffect } from 'react';
import { useStore } from 'zustand';
import { journeyStore, type JourneyStore } from '../../store/journey';
import { frameBounds, isMeasuring } from './adapt';
import type { Tier } from './profile';
import { qualityStore, type QualityStore } from './store';

/** Exposes the tier on the canvas for end-to-end tests and debugging. */
function markTier(canvas: HTMLCanvasElement, tier: Tier): void {
  canvas.dataset.quality = tier;
}

interface Props {
  store?: QualityStore;
  journey?: JourneyStore;
}

/**
 * Measures the frame rate after the boot panel and steps the quality tier down or up. Marks
 * the canvas with `data-quality` for tests and debugging.
 */
export function QualityMonitor({ store = qualityStore, journey = journeyStore }: Props) {
  const gl = useThree((s) => s.gl);
  const tier = useStore(store, (s) => s.tier);
  const forced = useStore(store, (s) => s.forced);
  const handheld = useStore(store, (s) => s.handheld);
  const phase = useStore(journey, (s) => s.phase);

  useEffect(() => {
    markTier(gl.domElement, tier);
  }, [gl, tier]);

  if (!isMeasuring(phase, forced)) return null;
  return (
    <PerformanceMonitor
      bounds={frameBounds(handheld)}
      flipflops={Infinity}
      onDecline={() => {
        store.getState().step('down');
      }}
      onIncline={() => {
        store.getState().step('up');
      }}
    />
  );
}
