/** How long "Back to Earth" takes to rewind the whole voyage. */
export const FLY_BACK_MS = 4000;
const MIN_FLIGHT_MS = 1000;
const MAX_FLIGHT_MS = 4000;

const easeInOutCubic = (t: number): number => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

/** Duration of a map jump across `distance` of progress: 1 s plus 3 s per whole route. */
export function flightMs(distance: number): number {
  const ms = MIN_FLIGHT_MS + (MAX_FLIGHT_MS - MIN_FLIGHT_MS) * Math.abs(distance);
  return Math.min(MAX_FLIGHT_MS, Math.max(MIN_FLIGHT_MS, ms));
}

/** A flight's target progress `elapsedMs` after it left `from` for `to`, eased in and out. */
export function flightTarget(
  from: number,
  to: number,
  elapsedMs: number,
  durationMs: number,
): number {
  const t = Math.min(1, Math.max(0, elapsedMs / durationMs));
  return from + (to - from) * easeInOutCubic(t);
}

export const flightDone = (elapsedMs: number, durationMs: number): boolean =>
  elapsedMs >= durationMs;
