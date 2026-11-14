import { describe, expect, it } from 'vitest';
import { FLY_BACK_MS, flyBackDone, flyBackTarget } from './flyBack';

describe('flyBackTarget', () => {
  it('starts where the rewind began and ends at the start of the route', () => {
    expect(flyBackTarget(1, 0)).toBe(1);
    expect(flyBackTarget(1, FLY_BACK_MS)).toBe(0);
  });

  it('eases in and out: slow at both ends, halfway at half time', () => {
    const step = FLY_BACK_MS / 100;
    expect(1 - flyBackTarget(1, step)).toBeLessThan(0.001);
    expect(flyBackTarget(1, FLY_BACK_MS - step)).toBeLessThan(0.001);
    expect(flyBackTarget(1, FLY_BACK_MS / 2)).toBeCloseTo(0.5);
  });

  it('only moves toward the start and clamps outside the rewind', () => {
    let previous = 0.7;
    for (let t = 0; t <= FLY_BACK_MS; t += 50) {
      const p = flyBackTarget(0.7, t);
      expect(p).toBeLessThanOrEqual(previous);
      previous = p;
    }
    expect(flyBackTarget(0.7, -10)).toBe(0.7);
    expect(flyBackTarget(0.7, FLY_BACK_MS * 3)).toBe(0);
  });

  it('is done once the duration has passed', () => {
    expect(flyBackDone(FLY_BACK_MS - 1)).toBe(false);
    expect(flyBackDone(FLY_BACK_MS)).toBe(true);
  });
});
