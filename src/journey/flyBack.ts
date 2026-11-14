/** How long "Back to Earth" takes to rewind the whole voyage. */
export const FLY_BACK_MS = 4000;

const easeInOutCubic = (t: number): number => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

/** The rewind's target progress `elapsedMs` after it started from progress `from`. */
export function flyBackTarget(from: number, elapsedMs: number): number {
  const t = Math.min(1, Math.max(0, elapsedMs / FLY_BACK_MS));
  return from * (1 - easeInOutCubic(t));
}

export const flyBackDone = (elapsedMs: number): boolean => elapsedMs >= FLY_BACK_MS;
