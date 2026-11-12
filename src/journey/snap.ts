import type { Range } from './stops';

export const SNAP_IDLE_MS = 180;
/** Share of a range's extent (on each side of the close point) that snaps. */
const SNAP_FRACTION = 0.5;
const EPSILON = 1e-6;

/** The close point to ease to once input is idle, or null to stay put. */
export function snapTarget(
  p: number,
  closePoints: readonly number[],
  ranges: readonly Range[],
  idleMs: number,
): number | null {
  if (idleMs < SNAP_IDLE_MS) return null;
  for (let i = 0; i < closePoints.length; i++) {
    const cp = closePoints[i];
    const range = ranges[i];
    if (cp === undefined || !range) continue;
    const reach = (p < cp ? cp - range[0] : range[1] - cp) * SNAP_FRACTION;
    const distance = Math.abs(p - cp);
    if (distance <= reach) return distance < EPSILON ? null : cp;
  }
  return null;
}
