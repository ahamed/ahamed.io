/** Apparent size thresholds as a fraction of viewport height. */
export const OPEN_SIZE = 0.18;
export const CLOSE_SIZE = 0.1;
const FULL_SIZE = 0.35;
const MIN_SCALE = 0.7;
const MIN_OPACITY = 0.4;

const clamp01 = (x: number): number => Math.min(1, Math.max(0, x));

/** Fraction of the viewport height a sphere of `radius` at `distance` covers. */
export const apparentSize = (radius: number, distance: number, fovY: number): number =>
  (2 * Math.atan(radius / Math.max(distance, radius))) / fovY;

/**
 * Index of the stop whose dialog should be open, with hysteresis: the currently open stop
 * stays open until it drops below CLOSE_SIZE; others need OPEN_SIZE. Largest wins.
 */
export function chooseOpenStop(
  sizes: readonly number[],
  currentOpen: number | null,
): number | null {
  let best: number | null = null;
  let bestSize = -1;
  for (let i = 0; i < sizes.length; i++) {
    const size = sizes[i] ?? 0;
    const threshold = i === currentOpen ? CLOSE_SIZE : OPEN_SIZE;
    if (size >= threshold && size > bestSize) {
      best = i;
      bestSize = size;
    }
  }
  return best;
}

const ramp = (size: number): number => clamp01((size - CLOSE_SIZE) / (FULL_SIZE - CLOSE_SIZE));

export const dialogScale = (size: number): number => MIN_SCALE + (1 - MIN_SCALE) * ramp(size);

export const dialogOpacity = (size: number): number => MIN_OPACITY + (1 - MIN_OPACITY) * ramp(size);
