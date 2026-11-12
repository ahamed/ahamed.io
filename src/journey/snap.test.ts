import { describe, expect, it } from 'vitest';
import { SNAP_IDLE_MS, snapTarget } from './snap';
import { stopRanges } from './stops';

const closePoints = [0, 0.8];
const ranges = stopRanges(closePoints);

describe('snapTarget', () => {
  it('does nothing while input is recent', () => {
    expect(snapTarget(0.77, closePoints, ranges, SNAP_IDLE_MS - 1)).toBeNull();
  });

  it('snaps to the close point inside the zone once idle', () => {
    expect(snapTarget(0.77, closePoints, ranges, SNAP_IDLE_MS)).toBe(0.8);
    expect(snapTarget(0.82, closePoints, ranges, SNAP_IDLE_MS + 500)).toBe(0.8);
  });

  it('leaves the position alone outside every zone', () => {
    expect(snapTarget(0.4, closePoints, ranges, 10_000)).toBeNull();
    expect(snapTarget(0.6, closePoints, ranges, 10_000)).toBeNull();
  });

  it('returns null when already on the close point', () => {
    expect(snapTarget(0.8, closePoints, ranges, 10_000)).toBeNull();
  });
});
