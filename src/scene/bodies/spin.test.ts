import { describe, expect, it } from 'vitest';
import { ROCK_PRESETS } from './rockShape';
import { seededAxis, spinAngle, SPINS, type SpinKey } from './spin';

const TAU = Math.PI * 2;
const DEG = Math.PI / 180;

const ROUND: SpinKey[] = [
  'earth',
  'earth-clouds',
  'moon',
  'mars',
  'jupiter',
  'saturn',
  'io',
  'europa',
  'ganymede',
  'callisto',
  'titan',
  'rhea',
  'iapetus',
  'enceladus',
];
const ROCKY: SpinKey[] = [
  'phobos',
  'deimos',
  'ceres',
  'vesta',
  'pallas',
  'hygiea',
  'eris',
  'comet-nucleus',
  'arrokoth',
];
const SLOWEST: SpinKey[] = ['pluto', 'charon'];
const SEEDED: SpinKey[] = [
  'phobos',
  'deimos',
  'ceres',
  'vesta',
  'pallas',
  'hygiea',
  'eris',
  'comet-nucleus',
];

const length = ([x, y, z]: readonly number[]) => Math.hypot(x ?? 0, y ?? 0, z ?? 0);

describe('spinAngle', () => {
  it('is zero at rest and for any time under reduced motion', () => {
    expect(spinAngle(0, 60, false)).toBe(0);
    for (const t of [0, 1.5, 37, 1e4]) expect(spinAngle(t, 60, true)).toBe(0);
  });

  it('wraps into [0, 2π) and returns to zero after a full period', () => {
    for (let t = 0; t < 500; t += 3.7) {
      const a = spinAngle(t, 45, false);
      expect(a).toBeGreaterThanOrEqual(0);
      expect(a).toBeLessThan(TAU);
    }
    expect(spinAngle(90, 45, false)).toBeCloseTo(0, 9);
    expect(spinAngle(22.5, 45, false)).toBeCloseTo(Math.PI, 9);
  });

  it('steps smoothly and deterministically', () => {
    const a = spinAngle(10, 30, false);
    const b = spinAngle(10 + 1 / 60, 30, false);
    expect(b - a).toBeGreaterThan(0);
    expect(b - a).toBeLessThan(1 * DEG);
    expect(spinAngle(10, 30, false)).toBe(a);
  });
});

describe('seededAxis', () => {
  it('is a unit vector tilted from +Y within bounds, identical for the same seed', () => {
    for (let seed = 1; seed < 40; seed++) {
      const axis = seededAxis(seed, 20 * DEG, 60 * DEG);
      expect(length(axis)).toBeCloseTo(1, 9);
      const tilt = Math.acos(axis[1]);
      expect(tilt).toBeGreaterThanOrEqual(20 * DEG - 1e-9);
      expect(tilt).toBeLessThanOrEqual(60 * DEG + 1e-9);
      expect(seededAxis(seed, 20 * DEG, 60 * DEG)).toEqual(axis);
    }
    expect(seededAxis(1, 20 * DEG, 60 * DEG)).not.toEqual(seededAxis(2, 20 * DEG, 60 * DEG));
  });
});

describe('SPINS', () => {
  it('gives every body a unit axis and a period in its group range', () => {
    for (const key of ROUND) {
      expect(SPINS[key].period, key).toBeGreaterThanOrEqual(60);
      expect(SPINS[key].period, key).toBeLessThanOrEqual(120);
    }
    for (const key of ROCKY) {
      expect(SPINS[key].period, key).toBeGreaterThanOrEqual(30);
      expect(SPINS[key].period, key).toBeLessThanOrEqual(45);
    }
    for (const key of Object.keys(SPINS) as SpinKey[]) {
      expect(length(SPINS[key].axis), key).toBeCloseTo(1, 9);
    }
    expect(Object.keys(SPINS).sort()).toEqual([...ROUND, ...ROCKY, ...SLOWEST].sort());
  });

  it('makes Pluto and Charon slower than every other body', () => {
    const others = [...ROUND, ...ROCKY].map((k) => SPINS[k].period);
    for (const key of SLOWEST) expect(SPINS[key].period).toBeGreaterThan(Math.max(...others));
  });

  it('turns Earth’s clouds faster than its surface', () => {
    expect(SPINS['earth-clouds'].period).toBeLessThan(SPINS.earth.period);
  });

  it('spins round bodies about their pole, Arrokoth end over end', () => {
    for (const key of [...ROUND, ...SLOWEST]) expect(SPINS[key].axis, key).toEqual([0, 1, 0]);
    // The lobes lie along local X and are flattened along local Y (their short axis).
    expect(SPINS.arrokoth.axis[0]).toBe(0);
    for (const lobe of ['arrokoth-wenu', 'arrokoth-weeyo'] as const) {
      const [, short] = ROCK_PRESETS[lobe].squash;
      expect(short).toBe(Math.min(...ROCK_PRESETS[lobe].squash));
    }
    expect(SPINS.arrokoth.axis).toEqual([0, 1, 0]);
  });

  it('gives each rock its own tilted, seeded axis', () => {
    const axes = SEEDED.map((k) => SPINS[k].axis.join(','));
    expect(new Set(axes).size).toBe(SEEDED.length);
    for (const key of SEEDED) expect(Math.acos(SPINS[key].axis[1]), key).toBeGreaterThan(DEG);
  });
});
