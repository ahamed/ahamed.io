import { describe, expect, it } from 'vitest';
import type { Vec3 } from '../../journey/route';
import { ROCK_PRESETS, rockPoint, rockShade, type RockPresetId } from './rockShape';

/** Evenly spread unit directions (Fibonacci sphere). */
function directions(n: number): Vec3[] {
  const out: Vec3[] = [];
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < n; i++) {
    const y = 1 - (2 * (i + 0.5)) / n;
    const r = Math.sqrt(1 - y * y);
    out.push([Math.cos(golden * i) * r, y, Math.sin(golden * i) * r]);
  }
  return out;
}

const DIRS = directions(2000);
const sample = (id: RockPresetId) => DIRS.map((d) => rockPoint([0, 0, 0], d, ROCK_PRESETS[id]));
const radii = (id: RockPresetId) => sample(id).map((p) => Math.hypot(...p));

/** Coefficient of variation of the radius: 0 for a sphere. */
function roughness(id: RockPresetId): number {
  const r = radii(id);
  const mean = r.reduce((a, b) => a + b, 0) / r.length;
  const sd = Math.sqrt(r.reduce((a, b) => a + (b - mean) ** 2, 0) / r.length);
  return sd / mean;
}

const IDS = Object.keys(ROCK_PRESETS) as RockPresetId[];

describe('rockPoint', () => {
  it('covers every body and belt shape', () => {
    for (const id of [
      'phobos',
      'deimos',
      'ceres',
      'vesta',
      'pallas',
      'hygiea',
      'belt-a',
      'belt-b',
      'belt-c',
    ]) {
      expect(IDS).toContain(id);
    }
  });

  it.each(IDS)('%s is deterministic, with a positive bounded radius', (id) => {
    expect(sample(id)).toEqual(sample(id));
    for (const r of radii(id)) {
      expect(r).toBeGreaterThan(0.4);
      expect(r).toBeLessThan(1.6);
    }
  });

  it('gives every preset its own shape', () => {
    const shapes = IDS.map((id) => radii(id).slice(0, 50).join());
    expect(new Set(shapes).size).toBe(IDS.length);
  });

  it('keeps Ceres and Hygiea nearly round and makes Pallas clearly irregular', () => {
    expect(roughness('ceres')).toBeLessThan(0.03);
    expect(roughness('hygiea')).toBeLessThan(0.04);
    expect(roughness('pallas')).toBeGreaterThan(0.06);
    expect(roughness('phobos')).toBeGreaterThan(roughness('deimos'));
  });

  it('flattens Vesta, with its lowest point at the south pole', () => {
    const points = sample('vesta');
    const extent = (k: 0 | 1 | 2) =>
      Math.max(...points.map((p) => p[k])) - Math.min(...points.map((p) => p[k]));
    expect(extent(1)).toBeLessThan(extent(0) * 0.92);
    expect(extent(1)).toBeLessThan(extent(2) * 0.92);
    const south = Math.hypot(...rockPoint([0, 0, 0], [0, -1, 0], ROCK_PRESETS.vesta));
    const north = Math.hypot(...rockPoint([0, 0, 0], [0, 1, 0], ROCK_PRESETS.vesta));
    expect(south).toBeLessThan(north * 0.85);
  });

  it('writes into and returns the provided vector', () => {
    const out: Vec3 = [9, 9, 9];
    expect(rockPoint(out, [1, 0, 0], ROCK_PRESETS.ceres)).toBe(out);
    expect(out[0]).toBeGreaterThan(0);
  });
});

describe('rockShade', () => {
  const shades = (id: RockPresetId) => DIRS.map((d) => rockShade(d, ROCK_PRESETS[id]));

  it('gives Ceres a few bright spots and keeps most of it plain', () => {
    const s = shades('ceres');
    const bright = s.filter((v) => v > 1.3).length;
    expect(bright).toBeGreaterThan(0);
    expect(bright).toBeLessThan(s.length * 0.05);
  });

  it('makes Hygiea darker than Ceres on average', () => {
    const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
    expect(mean(shades('hygiea'))).toBeLessThan(mean(shades('ceres')) * 0.7);
  });

  it('stays positive', () => {
    for (const id of IDS) for (const v of shades(id)) expect(v).toBeGreaterThan(0);
  });
});
