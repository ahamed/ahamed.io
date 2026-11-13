import { describe, expect, it } from 'vitest';
import type { Vec3 } from '../../journey/route';
import { createDust, DUST_LIMITS, dustResponse, wrapInto } from './dust';

describe('createDust', () => {
  it('is seeded and fills the box', () => {
    const a = createDust(1500, 3, 60);
    expect(a).toHaveLength(1500 * 3);
    expect(createDust(1500, 3, 60)).toEqual(a);
    for (const v of a) {
      expect(v).toBeGreaterThanOrEqual(-30);
      expect(v).toBeLessThanOrEqual(30);
    }
  });
});

describe('wrapInto', () => {
  const box = 60;

  it.each([
    [0, 0, 0],
    [3, -1, -250],
    [0, 2.2, -1000],
    [-17, 4, 12345],
  ])('keeps particles within ±box/2 of a camera at (%d, %d, %d)', (cx, cy, cz) => {
    const camera: Vec3 = [cx, cy, cz];
    const out: Vec3 = [0, 0, 0];
    const dust = createDust(200, 9, box);
    for (let i = 0; i < 200; i++) {
      const base: Vec3 = [dust[i * 3] ?? 0, dust[i * 3 + 1] ?? 0, dust[i * 3 + 2] ?? 0];
      wrapInto(out, base, camera, box);
      for (let k = 0; k < 3; k++) {
        expect(Math.abs((out[k] ?? 0) - (camera[k] ?? 0))).toBeLessThanOrEqual(box / 2 + 1e-9);
      }
    }
  });

  it('stays put in world space as the camera moves a little (away from the seam)', () => {
    const base: Vec3 = [5, 5, 5];
    const a = wrapInto([0, 0, 0], base, [0, 0, -1], box);
    const b = wrapInto([0, 0, 0], base, [0, 0, -1.1], box);
    for (let k = 0; k < 3; k++) expect(b[k]).toBeCloseTo(a[k] ?? NaN, 9);
  });
});

describe('dustResponse', () => {
  it('is fully off at rest and inside the dead zone', () => {
    expect(dustResponse(0)).toEqual({ opacity: 0, stretch: 0 });
    expect(dustResponse(0.001)).toEqual({ opacity: 0, stretch: 0 });
  });

  it('never decreases with speed and stays within its caps', () => {
    let last = { opacity: 0, stretch: 0 };
    for (let s = 0; s <= 2; s += 0.005) {
      const r = dustResponse(s);
      expect(r.opacity).toBeGreaterThanOrEqual(last.opacity);
      expect(r.stretch).toBeGreaterThanOrEqual(last.stretch);
      expect(r.opacity).toBeLessThanOrEqual(DUST_LIMITS.opacity);
      expect(r.stretch).toBeLessThanOrEqual(DUST_LIMITS.stretch);
      last = r;
    }
    expect(dustResponse(1).opacity).toBeCloseTo(DUST_LIMITS.opacity, 6);
  });

  it('treats non-finite or negative speeds as rest', () => {
    expect(dustResponse(Number.NaN)).toEqual({ opacity: 0, stretch: 0 });
    expect(dustResponse(-1)).toEqual({ opacity: 0, stretch: 0 });
  });
});
