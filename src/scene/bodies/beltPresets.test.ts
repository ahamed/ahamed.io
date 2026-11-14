import { describe, expect, it } from 'vitest';
import { STOPS } from '../../content/journey';
import { buildRoute } from '../../journey/route';
import { createBelt } from './belt';
import { asteroidBelt, kuiperBelt } from './beltPresets';

const route = buildRoute(STOPS);
const perUnit = (o: { count: number; zStart: number; zEnd: number }) =>
  o.count / (o.zStart - o.zEnd);

describe('belt presets', () => {
  it('makes the Kuiper belt wider and sparser per unit of route than the asteroid belt', () => {
    const asteroids = asteroidBelt(route);
    const kuiper = kuiperBelt(route);
    expect(kuiper.outer).toBeGreaterThan(asteroids.outer);
    expect(kuiper.thickness).toBeGreaterThan(asteroids.thickness);
    expect(perUnit(kuiper)).toBeLessThan(perUnit(asteroids));
  });

  it('keeps the Kuiper belt’s corridor clear and its rocks in the band', () => {
    const options = kuiperBelt(route);
    const belt = createBelt(options);
    for (let i = 0; i < belt.count; i++) {
      const x = belt.positions[i * 3] ?? 0;
      const y = belt.positions[i * 3 + 1] ?? 0;
      expect(Math.hypot(x, y) - (belt.scales[i] ?? 0)).toBeGreaterThanOrEqual(options.corridor);
      expect(Math.hypot(x, (y * options.outer) / options.thickness)).toBeLessThanOrEqual(
        options.outer + 1e-9,
      );
    }
  });
});
