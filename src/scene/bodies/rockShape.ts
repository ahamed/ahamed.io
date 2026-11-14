/**
 * Seeded rocky-body shapes (no three.js imports). A shape maps a unit direction to a surface
 * point and an albedo multiplier: value-noise fbm for lumps, cup craters with raised rims,
 * a per-axis squash, and optional bright spots.
 */
import type { Vec3 } from '../../journey/route';
import { mulberry32 } from '../random';

interface Crater {
  dir: Vec3;
  /** Angular radius (radians). */
  radius: number;
  /** Depth as a fraction of the body radius. */
  depth: number;
}

export interface RockPreset {
  seed: number;
  /** Lump height as a fraction of the radius. */
  amplitude: number;
  frequency: number;
  octaves: number;
  squash: Vec3;
  /** Random craters: count and angular-radius range. */
  craters: { count: number; min: number; max: number; depth: number };
  /** Named craters at fixed places (Stickney, Rheasilvia). */
  landmarks?: Crater[];
  /** Base albedo multiplier (1 = average). */
  albedo: number;
  /** Bright spots (Ceres): count and angular radius. */
  spots?: { count: number; radius: number; brightness: number };
}

export const ROCK_PRESETS = {
  phobos: {
    seed: 11,
    amplitude: 0.12,
    frequency: 1.6,
    octaves: 4,
    squash: [1, 0.8, 0.75],
    craters: { count: 18, min: 0.08, max: 0.3, depth: 0.05 },
    landmarks: [{ dir: [0.6, 0.2, 0.77], radius: 0.55, depth: 0.12 }],
    albedo: 0.8,
  },
  deimos: {
    seed: 23,
    amplitude: 0.06,
    frequency: 1.3,
    octaves: 3,
    squash: [1, 0.85, 0.78],
    craters: { count: 8, min: 0.08, max: 0.22, depth: 0.03 },
    albedo: 0.85,
  },
  ceres: {
    seed: 31,
    amplitude: 0.012,
    frequency: 2,
    octaves: 3,
    squash: [1, 0.97, 1],
    craters: { count: 30, min: 0.05, max: 0.18, depth: 0.012 },
    albedo: 0.9,
    spots: { count: 3, radius: 0.09, brightness: 1.9 },
  },
  vesta: {
    seed: 47,
    amplitude: 0.04,
    frequency: 1.8,
    octaves: 4,
    squash: [1, 0.82, 1],
    craters: { count: 16, min: 0.06, max: 0.2, depth: 0.02 },
    landmarks: [{ dir: [0, -1, 0], radius: 0.9, depth: 0.22 }],
    albedo: 1.05,
  },
  pallas: {
    seed: 59,
    amplitude: 0.32,
    frequency: 1.2,
    octaves: 4,
    squash: [1, 0.9, 0.85],
    craters: { count: 12, min: 0.1, max: 0.3, depth: 0.04 },
    albedo: 0.85,
  },
  hygiea: {
    seed: 71,
    amplitude: 0.018,
    frequency: 2,
    octaves: 3,
    squash: [1, 0.96, 1],
    craters: { count: 20, min: 0.05, max: 0.16, depth: 0.015 },
    albedo: 0.45,
  },
  'belt-a': {
    seed: 101,
    amplitude: 0.22,
    frequency: 1.4,
    octaves: 3,
    squash: [1, 0.7, 0.8],
    craters: { count: 5, min: 0.15, max: 0.35, depth: 0.05 },
    albedo: 0.8,
  },
  'belt-b': {
    seed: 113,
    amplitude: 0.15,
    frequency: 1.1,
    octaves: 3,
    squash: [1, 0.6, 0.55],
    craters: { count: 4, min: 0.2, max: 0.4, depth: 0.06 },
    albedo: 0.7,
  },
  'belt-c': {
    seed: 127,
    amplitude: 0.18,
    frequency: 1.8,
    octaves: 3,
    squash: [1, 0.85, 0.65],
    craters: { count: 6, min: 0.12, max: 0.3, depth: 0.05 },
    albedo: 0.9,
  },
} satisfies Record<string, RockPreset>;

export type RockPresetId = keyof typeof ROCK_PRESETS;

/** Per-preset derived data (noise lattice, crater and spot lists), built once. */
interface Baked {
  lattice: Float32Array;
  craters: Crater[];
  spots: Vec3[];
}

const LATTICE = 256;
const baked = new WeakMap<RockPreset, Baked>();

function randomDir(rand: () => number): Vec3 {
  const z = 2 * rand() - 1;
  const phi = 2 * Math.PI * rand();
  const r = Math.sqrt(1 - z * z);
  return [r * Math.cos(phi), r * Math.sin(phi), z];
}

function normalize(v: Vec3): Vec3 {
  const k = Math.hypot(...v);
  return [v[0] / k, v[1] / k, v[2] / k];
}

function bake(preset: RockPreset): Baked {
  const cached = baked.get(preset);
  if (cached) return cached;
  const rand = mulberry32(preset.seed);
  const lattice = new Float32Array(LATTICE);
  for (let i = 0; i < LATTICE; i++) lattice[i] = rand() * 2 - 1;
  const { count, min, max, depth } = preset.craters;
  const craters: Crater[] = Array.from({ length: count }, () => ({
    dir: randomDir(rand),
    radius: min + (max - min) * rand() ** 2,
    depth: depth * (0.5 + rand()),
  }));
  for (const l of preset.landmarks ?? []) craters.push({ ...l, dir: normalize(l.dir) });
  const spots = Array.from({ length: preset.spots?.count ?? 0 }, () => randomDir(rand));
  const result = { lattice, craters, spots };
  baked.set(preset, result);
  return result;
}

const hash = (lattice: Float32Array, x: number, y: number, z: number): number =>
  lattice[(((x * 73856093) ^ (y * 19349663) ^ (z * 83492791)) >>> 0) % LATTICE] ?? 0;

const fade = (t: number) => t * t * (3 - 2 * t);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

function valueNoise(lattice: Float32Array, x: number, y: number, z: number): number {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const iz = Math.floor(z);
  const fx = fade(x - ix);
  const fy = fade(y - iy);
  const fz = fade(z - iz);
  const c = (dx: number, dy: number, dz: number) => hash(lattice, ix + dx, iy + dy, iz + dz);
  return lerp(
    lerp(lerp(c(0, 0, 0), c(1, 0, 0), fx), lerp(c(0, 1, 0), c(1, 1, 0), fx), fy),
    lerp(lerp(c(0, 0, 1), c(1, 0, 1), fx), lerp(c(0, 1, 1), c(1, 1, 1), fx), fy),
    fz,
  );
}

function fbm(lattice: Float32Array, dir: Readonly<Vec3>, frequency: number, octaves: number) {
  let sum = 0;
  let amp = 0.5;
  let f = frequency;
  for (let o = 0; o < octaves; o++) {
    sum += amp * valueNoise(lattice, dir[0] * f + 17.1 * o, dir[1] * f, dir[2] * f);
    f *= 2;
    amp *= 0.5;
  }
  return sum;
}

const angle = (a: Readonly<Vec3>, b: Readonly<Vec3>) =>
  Math.acos(Math.max(-1, Math.min(1, a[0] * b[0] + a[1] * b[1] + a[2] * b[2])));

/** Crater profile at angular distance `a`: a cup with a slightly raised rim. */
function craterHeight(c: Crater, a: number): number {
  const t = a / c.radius;
  if (t < 1) return -c.depth * (1 - t * t);
  if (t < 1.4) return c.depth * 0.25 * Math.sin(((t - 1) / 0.4) * Math.PI);
  return 0;
}

/** Surface point for unit direction `dir`, written into `out` (unit body radius). */
export function rockPoint(out: Vec3, dir: Readonly<Vec3>, preset: RockPreset): Vec3 {
  const { lattice, craters } = bake(preset);
  let r = 1 + preset.amplitude * fbm(lattice, dir, preset.frequency, preset.octaves);
  for (const c of craters) r += craterHeight(c, angle(dir, c.dir));
  out[0] = dir[0] * r * preset.squash[0];
  out[1] = dir[1] * r * preset.squash[1];
  out[2] = dir[2] * r * preset.squash[2];
  return out;
}

/** Albedo multiplier for unit direction `dir`: mottling, darker crater floors, bright spots. */
export function rockShade(dir: Readonly<Vec3>, preset: RockPreset): number {
  const { lattice, craters, spots } = bake(preset);
  let shade = preset.albedo * (1 + 0.25 * fbm(lattice, dir, preset.frequency * 3, 2));
  for (const c of craters) if (angle(dir, c.dir) < c.radius) shade *= 0.88;
  const s = preset.spots;
  if (s) {
    for (const spot of spots) {
      const t = angle(dir, spot) / s.radius;
      if (t < 1) shade = Math.max(shade, preset.albedo * lerp(s.brightness, 1, t * t));
    }
  }
  return Math.max(0.05, shade);
}
