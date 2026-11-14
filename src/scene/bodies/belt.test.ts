import { describe, expect, it } from 'vitest';
import { STOPS } from '../../content/journey';
import { buildRoute } from '../../journey/route';
import { BELT_SHAPES, beltSpan, createBelt, type BeltOptions } from './belt';

const options: BeltOptions = {
  count: 2500,
  seed: 1801,
  zStart: -1500,
  zEnd: -3000,
  corridor: 16,
  outer: 140,
  thickness: 30,
};

describe('createBelt', () => {
  const belt = createBelt(options);
  const at = (i: number) => ({
    x: belt.positions[i * 3] ?? NaN,
    y: belt.positions[i * 3 + 1] ?? NaN,
    z: belt.positions[i * 3 + 2] ?? NaN,
    scale: belt.scales[i] ?? NaN,
  });

  it('makes exactly the requested number of rocks', () => {
    expect(belt.count).toBe(2500);
    expect(belt.positions).toHaveLength(2500 * 3);
    expect(belt.scales).toHaveLength(2500);
    expect(belt.shapes).toHaveLength(2500);
    expect(belt.axes).toHaveLength(2500 * 3);
    expect(belt.rates).toHaveLength(2500);
    expect(belt.rotations).toHaveLength(2500 * 4);
  });

  it('is identical for the same seed', () => {
    expect(createBelt(options)).toEqual(belt);
    expect(createBelt({ ...options, seed: 2 }).positions).not.toEqual(belt.positions);
  });

  it('keeps every rock, including its size, outside the corridor and inside the band', () => {
    for (let i = 0; i < belt.count; i++) {
      const { x, y, scale } = at(i);
      expect(Math.hypot(x, y) - scale).toBeGreaterThanOrEqual(options.corridor);
      expect(Math.hypot(x, (y * options.outer) / options.thickness)).toBeLessThanOrEqual(
        options.outer,
      );
    }
  });

  it('spreads rocks over the whole span and nowhere else', () => {
    const zs = Array.from({ length: belt.count }, (_, i) => at(i).z);
    expect(Math.max(...zs)).toBeLessThanOrEqual(options.zStart);
    expect(Math.min(...zs)).toBeGreaterThanOrEqual(options.zEnd);
    expect(Math.max(...zs)).toBeGreaterThan(options.zStart - 100);
    expect(Math.min(...zs)).toBeLessThan(options.zEnd + 100);
  });

  it('tapers rock sizes at both ends of the belt so it fades in and out', () => {
    const span = options.zStart - options.zEnd;
    const meanScale = (from: number, to: number) => {
      const s = Array.from({ length: belt.count }, (_, i) => at(i)).filter((r) => {
        const t = (options.zStart - r.z) / span;
        return t >= from && t < to;
      });
      return s.reduce((a, r) => a + r.scale, 0) / s.length;
    };
    expect(meanScale(0, 0.03)).toBeLessThan(meanScale(0.3, 0.7) * 0.35);
    expect(meanScale(0.97, 1)).toBeLessThan(meanScale(0.3, 0.7) * 0.35);
  });

  it('uses only the available rock shapes, unit spin axes and unit rotations', () => {
    for (let i = 0; i < belt.count; i++) {
      expect(belt.shapes[i]).toBeLessThan(BELT_SHAPES.length);
      const [ax, ay, az] = [0, 1, 2].map((k) => belt.axes[i * 3 + k] ?? 0);
      expect(Math.hypot(ax ?? 0, ay ?? 0, az ?? 0)).toBeCloseTo(1, 5);
      const q = [0, 1, 2, 3].map((k) => belt.rotations[i * 4 + k] ?? 0);
      expect(Math.hypot(...q)).toBeCloseTo(1, 5);
    }
  });

  it('makes most rocks small and a few large', () => {
    const scales = [...belt.scales].sort((a, b) => a - b);
    expect(scales[Math.floor(scales.length / 2)]).toBeLessThan(0.8);
    expect(scales.at(-1)).toBeGreaterThan(1.5);
  });
});

describe('beltSpan', () => {
  const route = buildRoute(STOPS);
  const z = (id: string) => route.bodies.find((b) => b.id === id)?.position[2] ?? NaN;

  it('starts between Deimos and Ceres and ends past Hygiea, before the route ends', () => {
    const { zStart, zEnd } = beltSpan(route);
    expect(zStart).toBeLessThan(z('deimos'));
    expect(zStart).toBeGreaterThan(z('ceres'));
    expect(zEnd).toBeLessThan(z('hygiea'));
    expect(zEnd).toBeGreaterThan(-route.length);
  });

  it('ends halfway between Hygiea and Jupiter, so no belt rock reaches the gas giants', () => {
    expect(beltSpan(route).zEnd).toBeCloseTo((z('hygiea') + z('jupiter')) / 2, 9);
  });

  it('ends halfway to the route end when Hygiea is the last body', () => {
    const inner = buildRoute(STOPS.slice(0, STOPS.findIndex((s) => s.id === 'hygiea') + 1));
    const zi = (id: string) => inner.bodies.find((b) => b.id === id)?.position[2] ?? NaN;
    expect(beltSpan(inner).zEnd).toBeCloseTo((zi('hygiea') - inner.length) / 2, 9);
  });
});
