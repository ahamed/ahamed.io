import { describe, expect, it } from 'vitest';
import { createStarField } from './starField';

describe('createStarField', () => {
  const field = createStarField(4000, 1977);

  it('is byte-identical for the same seed and differs for another', () => {
    const again = createStarField(4000, 1977);
    expect(again.positions).toEqual(field.positions);
    expect(again.sizes).toEqual(field.sizes);
    expect(again.colors).toEqual(field.colors);
    expect(again.phases).toEqual(field.phases);
    expect(createStarField(4000, 7).positions).not.toEqual(field.positions);
  });

  it('has one entry per star in every attribute', () => {
    expect(field.count).toBe(4000);
    expect(field.positions).toHaveLength(4000 * 3);
    expect(field.colors).toHaveLength(4000 * 3);
    expect(field.sizes).toHaveLength(4000);
    expect(field.phases).toHaveLength(4000);
  });

  it('puts every star on the unit sphere, spread evenly over all octants', () => {
    const octants = new Array<number>(8).fill(0);
    for (let i = 0; i < field.count; i++) {
      const x = field.positions[i * 3] ?? 0;
      const y = field.positions[i * 3 + 1] ?? 0;
      const z = field.positions[i * 3 + 2] ?? 0;
      expect(Math.hypot(x, y, z)).toBeCloseTo(1, 5);
      const o = (x > 0 ? 1 : 0) + (y > 0 ? 2 : 0) + (z > 0 ? 4 : 0);
      octants[o] = (octants[o] ?? 0) + 1;
    }
    for (const n of octants) {
      expect(n).toBeGreaterThan((4000 / 8) * 0.75);
      expect(n).toBeLessThan((4000 / 8) * 1.25);
    }
  });

  it('makes most stars tiny and a few bright', () => {
    const sizes = [...field.sizes].sort((a, b) => a - b);
    for (const s of sizes) {
      expect(s).toBeGreaterThanOrEqual(0.6);
      expect(s).toBeLessThanOrEqual(3.0);
    }
    expect(sizes[Math.floor(sizes.length / 2)]).toBeLessThan(1);
    expect(sizes[sizes.length - 1]).toBeGreaterThan(2);
  });

  it('keeps colours and twinkle phases in range', () => {
    for (const c of field.colors) {
      expect(c).toBeGreaterThanOrEqual(0);
      expect(c).toBeLessThanOrEqual(1);
    }
    for (const p of field.phases) {
      expect(p).toBeGreaterThanOrEqual(0);
      expect(p).toBeLessThan(Math.PI * 2);
    }
  });
});
