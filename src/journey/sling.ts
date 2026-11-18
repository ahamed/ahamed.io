/**
 * Speed profiles around a lap (progress per second): braking into a capture point, the
 * scroll-mode slingshot coast and the autoplay slingshot. Each is continuous in speed.
 */

/** Rate (1/s) of the scroll-mode coast's rise and fall. */
export const COAST_RATE = 1.2;
/** Braking gain (1/s): the speed cap grows by this much per unit of progress to the capture. */
const K_BRAKE = 1.5;
/** Autoplay slingshot time constant (s). */
const SLING_TAU = 0.8;
/** Autoplay slingshot overshoot, as a share of cruise speed at its peak. */
const SLING_BOOST = 1;

/**
 * Coast speed `t` s after a lap ends: `(vExit + A·t)·e^(−k·t)`, starting at `vExit` and covering
 * `distance` in total.
 */
export function coastSpeed(t: number, distance: number, vExit: number, k = COAST_RATE): number {
  const a = Math.max(0, k * k * distance - k * vExit);
  return (vExit + a * t) * Math.exp(-k * t);
}

/** Autoplay speed `t` s after a lap ends: from `vExit`, above cruise, back to cruise. */
export function autoplaySlingSpeed(t: number, cruise: number, vExit: number): number {
  const u = t / SLING_TAU;
  return cruise - (cruise - vExit) * Math.exp(-u) + SLING_BOOST * cruise * u * Math.exp(1 - u);
}

/** Highest forward speed `distance` before a capture point, so Voyager arrives at `vEntry`. */
export const brakeCap = (distance: number, vEntry: number): number =>
  vEntry + K_BRAKE * Math.max(0, distance);
