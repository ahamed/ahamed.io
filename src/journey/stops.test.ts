import { describe, expect, it } from 'vitest';
import { activeStopIndex, neighbourTarget, stopRanges } from './stops';

const closePoints = [0, 0.8];

describe('stopRanges', () => {
  const ranges = stopRanges(closePoints);

  it('returns ordered, disjoint ranges that contain their close points', () => {
    ranges.forEach(([start, end], i) => {
      const cp = closePoints[i] ?? NaN;
      expect(start).toBeLessThanOrEqual(cp);
      expect(end).toBeGreaterThanOrEqual(cp);
      const prev = ranges[i - 1];
      if (prev) expect(start).toBeGreaterThan(prev[1]);
    });
  });

  it('stays inside [0, 1]', () => {
    expect(ranges[0]?.[0]).toBe(0);
    expect(ranges.at(-1)?.[1]).toBeLessThanOrEqual(1);
  });
});

describe('activeStopIndex', () => {
  const ranges = stopRanges(closePoints);
  it('follows the position', () => {
    expect(activeStopIndex(0, ranges)).toBe(0);
    expect(activeStopIndex(0.8, ranges)).toBe(1);
    expect(activeStopIndex(0.4, ranges)).toBeNull();
  });
});

describe('neighbourTarget', () => {
  it('finds the next and previous close points', () => {
    expect(neighbourTarget(0, closePoints, 1)).toBe(0.8);
    expect(neighbourTarget(0.4, closePoints, 1)).toBe(0.8);
    expect(neighbourTarget(0.8, closePoints, -1)).toBe(0);
  });

  it('falls back to the route ends', () => {
    expect(neighbourTarget(0.8, closePoints, 1)).toBe(1);
    expect(neighbourTarget(0, closePoints, -1)).toBe(0);
  });
});
