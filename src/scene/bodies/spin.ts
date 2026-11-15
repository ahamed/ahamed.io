/**
 * How each celestial body turns about its own axis (no three.js imports). Periods are chosen to
 * be visible, not real: about a minute or two for round bodies, faster for small rocks, and
 * slowest for Pluto and Charon so Pluto's heart lingers toward the camera.
 */
import type { Vec3 } from '../../journey/route';
import { mulberry32 } from '../random';

const TAU = Math.PI * 2;
const DEG = Math.PI / 180;

export type SpinKey =
  | 'earth'
  | 'earth-clouds'
  | 'moon'
  | 'mars'
  | 'phobos'
  | 'deimos'
  | 'ceres'
  | 'vesta'
  | 'pallas'
  | 'hygiea'
  | 'jupiter'
  | 'io'
  | 'europa'
  | 'ganymede'
  | 'callisto'
  | 'saturn'
  | 'titan'
  | 'rhea'
  | 'iapetus'
  | 'enceladus'
  | 'comet-nucleus'
  | 'pluto'
  | 'charon'
  | 'arrokoth'
  | 'eris';

export interface Spin {
  /** Unit spin axis in the body's local frame (inside any tilt it already has). */
  axis: Readonly<Vec3>;
  /** Seconds per full turn. */
  period: number;
}

/**
 * The body's spin angle (radians, in [0, 2π)) after `t` seconds: zero at rest and always zero
 * under reduced motion, so the resting pose is the pose every body had before it spun.
 */
export function spinAngle(t: number, period: number, reduced: boolean): number {
  if (reduced) return 0;
  const a = ((TAU * t) / period) % TAU;
  return a < 0 ? a + TAU : a;
}

/** A unit axis tilted from +Y by a seeded angle in [minTilt, maxTilt], at a seeded azimuth. */
export function seededAxis(seed: number, minTilt: number, maxTilt: number): Vec3 {
  const random = mulberry32(seed);
  const tilt = minTilt + (maxTilt - minTilt) * random();
  const azimuth = TAU * random();
  return [Math.sin(tilt) * Math.cos(azimuth), Math.cos(tilt), Math.sin(tilt) * Math.sin(azimuth)];
}

const POLE: Readonly<Vec3> = [0, 1, 0];
const round = (period: number): Spin => ({ axis: POLE, period });
const rock = (seed: number, period: number): Spin => ({
  axis: seededAxis(seed, 20 * DEG, 60 * DEG),
  period,
});

export const SPINS: Readonly<Record<SpinKey, Spin>> = {
  earth: round(90),
  'earth-clouds': round(60),
  moon: round(100),
  mars: round(80),
  jupiter: round(60),
  saturn: round(70),
  io: round(85),
  europa: round(95),
  ganymede: round(105),
  callisto: round(110),
  titan: round(100),
  rhea: round(90),
  iapetus: round(115),
  enceladus: round(80),
  phobos: rock(101, 32),
  deimos: rock(202, 38),
  ceres: rock(303, 45),
  vesta: rock(404, 40),
  pallas: rock(505, 36),
  hygiea: rock(606, 44),
  eris: rock(707, 42),
  'comet-nucleus': rock(808, 30),
  // End over end about the flattened lobes' short axis (local Y), perpendicular to the lobes'
  // line (local X), as the real contact binary turns.
  arrokoth: { axis: POLE, period: 34 },
  pluto: round(150),
  charon: round(160),
};
