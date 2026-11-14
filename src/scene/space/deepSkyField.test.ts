import { describe, expect, it } from 'vitest';
import { STOPS } from '../../content/journey';
import { buildRoute } from '../../journey/route';
import {
  armAngle,
  GALAXIES,
  galaxyCloud,
  galaxyStars,
  NEBULAE,
  type GalaxyOptions,
} from './deepSkyField';
import { heliopauseLayout } from './heliosphere';

const OPTIONS: GalaxyOptions = { count: 3000, radius: 200, arms: 2, twist: 2.2 };
const zStop = heliopauseLayout(buildRoute(STOPS)).zStop;

const wrap = (a: number) => Math.atan2(Math.sin(a), Math.cos(a));

describe('galaxyStars', () => {
  it('returns three coordinates and three colour channels per star', () => {
    const { positions, colors } = galaxyStars(7, OPTIONS);
    expect(positions).toHaveLength(OPTIONS.count * 3);
    expect(colors).toHaveLength(OPTIONS.count * 3);
  });

  it('lies in a thin disc', () => {
    const { positions } = galaxyStars(7, OPTIONS);
    let zz = 0;
    let rr = 0;
    for (let i = 0; i < OPTIONS.count; i++) {
      zz += (positions[i * 3 + 2] ?? 0) ** 2;
      rr += Math.hypot(positions[i * 3] ?? 0, positions[i * 3 + 1] ?? 0) ** 2;
    }
    expect(Math.sqrt(zz / OPTIONS.count)).toBeLessThan(0.05 * OPTIONS.radius);
    expect(Math.sqrt(rr / OPTIONS.count)).toBeGreaterThan(0.25 * OPTIONS.radius);
  });

  it('puts most stars outside the bulge close to a spiral arm', () => {
    const { positions } = galaxyStars(7, OPTIONS);
    let outer = 0;
    let near = 0;
    for (let i = 0; i < OPTIONS.count; i++) {
      const x = positions[i * 3] ?? 0;
      const y = positions[i * 3 + 1] ?? 0;
      const r = Math.hypot(x, y);
      if (r < 0.3 * OPTIONS.radius) continue;
      outer++;
      const theta = Math.atan2(y, x);
      const off = Math.min(
        ...Array.from({ length: OPTIONS.arms }, (_, arm) =>
          Math.abs(wrap(theta - armAngle(r, arm, OPTIONS))),
        ),
      );
      if (off < 0.6) near++;
    }
    expect(outer).toBeGreaterThan(OPTIONS.count * 0.4);
    expect(near / outer).toBeGreaterThan(0.75);
  });

  it('gives the same stars for the same seed and different stars for another', () => {
    expect(galaxyStars(7, OPTIONS).positions).toEqual(galaxyStars(7, OPTIONS).positions);
    expect(galaxyStars(8, OPTIONS).positions).not.toEqual(galaxyStars(7, OPTIONS).positions);
  });
});

describe('deep-sky presets', () => {
  it('has three or four galaxies and three nebula clouds, all beyond the heliopause stop and off the path', () => {
    expect(GALAXIES.length).toBeGreaterThanOrEqual(3);
    expect(GALAXIES.length).toBeLessThanOrEqual(4);
    expect(NEBULAE).toHaveLength(3);
    for (const { offset } of [...GALAXIES, ...NEBULAE]) {
      expect(offset[2]).toBeLessThan(-1500);
      // Within the camera's far plane (5,000) from the heliopause stop.
      expect(Math.hypot(...offset)).toBeLessThan(5000);
      expect(Math.hypot(offset[0], offset[1])).toBeGreaterThan(300);
    }
  });

  it('merges every galaxy into one cloud placed beyond the stop', () => {
    const { positions, colors } = galaxyCloud(zStop);
    const total = GALAXIES.reduce((n, g) => n + g.options.count, 0);
    expect(positions).toHaveLength(total * 3);
    expect(colors).toHaveLength(total * 3);
    for (let i = 0; i < total; i += 97) {
      expect(positions[i * 3 + 2]).toBeLessThan(zStop - 1000);
    }
  });
});
