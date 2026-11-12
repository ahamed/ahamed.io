import { describe, expect, it } from 'vitest';
import { applyDelta, clampProgress, damp } from './progress';

describe('clampProgress / applyDelta', () => {
  it('clamps to [0, 1]', () => {
    expect(clampProgress(-0.2)).toBe(0);
    expect(clampProgress(1.4)).toBe(1);
    expect(clampProgress(0.3)).toBe(0.3);
  });

  it('applies a delta and clamps the result', () => {
    expect(applyDelta(0.5, 0.1)).toBeCloseTo(0.6);
    expect(applyDelta(0.95, 0.2)).toBe(1);
    expect(applyDelta(0.05, -0.2)).toBe(0);
  });
});

describe('damp', () => {
  it('moves toward the target without overshooting', () => {
    let current = 0;
    for (let i = 0; i < 120; i++) {
      const next = damp(current, 1, 6, 1 / 60);
      expect(next).toBeGreaterThanOrEqual(current);
      expect(next).toBeLessThanOrEqual(1);
      current = next;
    }
    expect(current).toBeGreaterThan(0.99);
  });

  it('works backwards too', () => {
    expect(damp(1, 0, 6, 1 / 60)).toBeLessThan(1);
    expect(damp(1, 0, 6, 1 / 60)).toBeGreaterThan(0);
  });

  it('settles exactly on the target when very close', () => {
    expect(damp(0.500001, 0.5, 6, 1 / 60)).toBe(0.5);
  });

  it('is frame-rate independent', () => {
    let at60 = 0;
    for (let i = 0; i < 60; i++) at60 = damp(at60, 1, 6, 1 / 60);
    let at30 = 0;
    for (let i = 0; i < 30; i++) at30 = damp(at30, 1, 6, 1 / 30);
    expect(Math.abs(at60 - at30)).toBeLessThan(1e-3);
  });

  it('clamps huge frame gaps so a stalled tab does not teleport', () => {
    expect(damp(0, 1, 6, 5)).toBeCloseTo(damp(0, 1, 6, 0.1));
  });
});
