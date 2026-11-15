import { describe, expect, it } from 'vitest';
import { FLY_BACK_MS, flightDone, flightMs, flightTarget } from './flyTo';

describe('flightTarget', () => {
  it('starts at `from` and ends at `to`', () => {
    expect(flightTarget(1, 0, 0, FLY_BACK_MS)).toBe(1);
    expect(flightTarget(1, 0, FLY_BACK_MS, FLY_BACK_MS)).toBe(0);
    expect(flightTarget(0.2, 0.6, 2000, 2000)).toBeCloseTo(0.6);
  });

  it('eases in and out: slow at both ends, halfway at half time', () => {
    const step = FLY_BACK_MS / 100;
    expect(1 - flightTarget(1, 0, step, FLY_BACK_MS)).toBeLessThan(0.001);
    expect(flightTarget(1, 0, FLY_BACK_MS - step, FLY_BACK_MS)).toBeLessThan(0.001);
    expect(flightTarget(1, 0, FLY_BACK_MS / 2, FLY_BACK_MS)).toBeCloseTo(0.5);
    expect(flightTarget(0.2, 0.6, 1000, 2000)).toBeCloseTo(0.4);
  });

  it('only moves toward `to` and clamps outside the flight', () => {
    let previous = 0.7;
    for (let t = 0; t <= FLY_BACK_MS; t += 50) {
      const p = flightTarget(0.7, 0, t, FLY_BACK_MS);
      expect(p).toBeLessThanOrEqual(previous);
      previous = p;
    }
    expect(flightTarget(0.7, 0, -10, FLY_BACK_MS)).toBe(0.7);
    expect(flightTarget(0.7, 0, FLY_BACK_MS * 3, FLY_BACK_MS)).toBe(0);
  });

  it('is done once the duration has passed', () => {
    expect(flightDone(FLY_BACK_MS - 1, FLY_BACK_MS)).toBe(false);
    expect(flightDone(FLY_BACK_MS, FLY_BACK_MS)).toBe(true);
  });
});

describe('flightMs', () => {
  it('lasts between 1 and 4 seconds, longer for longer jumps', () => {
    expect(flightMs(0)).toBe(1000);
    expect(flightMs(0.5)).toBe(2500);
    expect(flightMs(-0.5)).toBe(2500);
    expect(flightMs(1)).toBe(4000);
    expect(flightMs(0.1)).toBeLessThan(flightMs(0.4));
  });
});
