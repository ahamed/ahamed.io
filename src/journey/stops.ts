export type Range = readonly [start: number, end: number];

/** Fraction of the gap to each neighbour that a stop's range covers (leaves gaps between stops). */
const RANGE_FRACTION = 0.4;
const EPSILON = 1e-6;

export function stopRanges(closePoints: readonly number[]): Range[] {
  return closePoints.map((cp, i) => {
    const prev = closePoints[i - 1];
    const next = closePoints[i + 1] ?? 1;
    const start = prev === undefined ? 0 : cp - (cp - prev) * RANGE_FRACTION;
    const end = cp + (next - cp) * RANGE_FRACTION;
    return [start, end] as const;
  });
}

export function activeStopIndex(p: number, ranges: readonly Range[]): number | null {
  for (let i = 0; i < ranges.length; i++) {
    const range = ranges[i];
    if (range && p >= range[0] && p <= range[1]) return i;
  }
  return null;
}

/** Next (`dir` 1) or previous (`dir` -1) close point from `p`, falling back to the route ends. */
export function neighbourTarget(p: number, closePoints: readonly number[], dir: 1 | -1): number {
  if (dir === 1) {
    for (const cp of closePoints) if (cp > p + EPSILON) return cp;
    return 1;
  }
  for (let i = closePoints.length - 1; i >= 0; i--) {
    const cp = closePoints[i];
    if (cp !== undefined && cp < p - EPSILON) return cp;
  }
  return 0;
}
