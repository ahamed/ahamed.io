import { describe, expect, it } from 'vitest';
import { bandOffset, bandSpeed } from './bands';

describe('Jupiter band drift', () => {
  it('is not offset at time 0', () => {
    for (const v of [0.1, 0.35, 0.5, 0.8]) expect(bandOffset(v, 0)).toBe(0);
  });

  it('moves neighbouring latitude bands at different speeds', () => {
    // Within one hemisphere (the profile is symmetric about the equator, like the real winds).
    const speeds = [0.5, 0.56, 0.62, 0.68, 0.74].map(bandSpeed);
    expect(new Set(speeds.map((s) => s.toFixed(6))).size).toBe(speeds.length);
    expect(bandOffset(0.5, 10)).not.toBeCloseTo(bandOffset(0.42, 10), 4);
  });

  it('includes bands moving in opposite directions, as zonal winds do', () => {
    const speeds = Array.from({ length: 41 }, (_, i) => bandSpeed(0.05 + (0.9 * i) / 40));
    expect(speeds.some((s) => s > 0)).toBe(true);
    expect(speeds.some((s) => s < 0)).toBe(true);
  });

  it('grows steadily with time at a fixed latitude', () => {
    const at = [0, 5, 10, 20].map((t) => bandOffset(0.45, t));
    for (let i = 1; i < at.length; i++) {
      expect(Math.abs(at[i] ?? 0)).toBeGreaterThan(Math.abs(at[i - 1] ?? 0));
    }
  });

  it('is gentle: no band slides more than a hundredth of the map per second', () => {
    for (let i = 0; i <= 100; i++) expect(Math.abs(bandSpeed(i / 100))).toBeLessThan(0.01);
  });
});
