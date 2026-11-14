import { describe, expect, it } from 'vitest';
import { arrokothLobes } from './arrokothLobes';
import { ROCK_PRESETS } from './rockShape';

describe('arrokothLobes', () => {
  const [big, small] = arrokothLobes(1);

  it('has a larger and a smaller lobe', () => {
    expect(big.radius).toBeGreaterThan(small.radius);
  });

  it('joins the lobes at a narrow neck: touching, overlapping less than a quarter of the smaller', () => {
    const overlap = big.radius + small.radius - Math.abs(big.x - small.x);
    expect(overlap).toBeGreaterThan(0);
    expect(overlap).toBeLessThan(0.25 * small.radius);
  });

  it('flattens both lobes', () => {
    for (const lobe of [big, small]) {
      expect(Math.min(...ROCK_PRESETS[lobe.preset].squash)).toBeLessThan(0.8);
    }
  });

  it('fits the body radius it is given', () => {
    const extent = Math.max(Math.abs(big.x) + big.radius, Math.abs(small.x) + small.radius);
    expect(extent).toBeLessThanOrEqual(1.3);
  });
});
