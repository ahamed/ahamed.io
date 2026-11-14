import type { Vec3 } from '../../journey/route';
import { mulberry32 } from '../random';

/**
 * The deep sky beyond the heliopause (no three.js imports): seeded spiral galaxies as star
 * particles, and the nebula cloud presets. Everything sits in the world past the heliopause
 * stop, so it shows parallax as Voyager moves.
 */

export interface GalaxyOptions {
  count: number;
  /** Disc radius (world units). */
  radius: number;
  arms: number;
  /** Arm winding: radians of turn per e-fold of radius. */
  twist: number;
}

/** Share of stars in the central bulge. */
const BULGE = 0.22;
/** Arms start this fraction of the radius out. */
const ARM_START = 0.08;
/** Disc thickness (standard deviation) as a fraction of the radius. */
const THICKNESS = 0.02;
/** Angular scatter (rad) about an arm. */
const ARM_SCATTER = 0.28;

/** Gaussian sample (Box–Muller) from a uniform source. */
const gaussian = (rand: () => number) =>
  Math.sqrt(-2 * Math.log(Math.max(rand(), 1e-9))) * Math.cos(2 * Math.PI * rand());

/** Polar angle of arm `arm` at radius `r`: a logarithmic spiral. */
export const armAngle = (r: number, arm: number, { radius, arms, twist }: GalaxyOptions): number =>
  (arm * 2 * Math.PI) / arms +
  twist * Math.log(Math.max(r, ARM_START * radius) / (ARM_START * radius));

/**
 * Star positions (a disc in the local XY plane) and colours for a spiral galaxy: a warm bulge
 * and bluish arms with Gaussian scatter. The same seed gives the same stars.
 */
export function galaxyStars(seed: number, options: GalaxyOptions) {
  const rand = mulberry32(seed);
  const { count, radius, arms } = options;
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    let x: number;
    let y: number;
    let warm: number;
    if (rand() < BULGE) {
      const r = Math.abs(gaussian(rand)) * 0.12 * radius;
      const a = rand() * 2 * Math.PI;
      x = r * Math.cos(a);
      y = r * Math.sin(a);
      warm = 1;
    } else {
      // Denser toward the centre, out to the rim.
      const r = radius * (ARM_START + (1 - ARM_START) * Math.pow(rand(), 0.8));
      const arm = Math.floor(rand() * arms);
      const a = armAngle(r, arm, options) + gaussian(rand) * ARM_SCATTER * (0.5 + r / radius);
      x = r * Math.cos(a);
      y = r * Math.sin(a);
      warm = 0.25 * (1 - r / radius);
    }
    positions[i * 3] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = gaussian(rand) * THICKNESS * radius;
    const shade = 0.55 + 0.45 * rand();
    colors[i * 3] = shade * (0.75 + 0.25 * warm);
    colors[i * 3 + 1] = shade * (0.8 + 0.05 * warm);
    colors[i * 3 + 2] = shade * (1 - 0.3 * warm);
  }
  return { positions, colors };
}

export interface GalaxyPreset {
  seed: number;
  options: GalaxyOptions;
  /** Centre relative to the heliopause stop's close point on the path. */
  offset: Vec3;
  /** Disc tilt: about X, then about Y (rad). */
  tilt: [number, number];
}

export const GALAXIES: readonly GalaxyPreset[] = [
  {
    seed: 3101,
    options: { count: 3000, radius: 260, arms: 2, twist: 2.4 },
    offset: [-900, 520, -3600],
    tilt: [0.9, 0.3],
  },
  {
    seed: 3202,
    options: { count: 3000, radius: 160, arms: 3, twist: 1.8 },
    offset: [1100, -260, -4000],
    tilt: [1.3, -0.6],
  },
  {
    seed: 3303,
    options: { count: 2500, radius: 120, arms: 2, twist: 3 },
    offset: [400, 900, -4300],
    tilt: [0.4, 1.1],
  },
  {
    seed: 3404,
    options: { count: 2500, radius: 180, arms: 4, twist: 2 },
    offset: [-1300, -700, -3300],
    tilt: [1.5, 0.2],
  },
];

/** Every galaxy's stars in world space, merged so they draw in one call. */
export function galaxyCloud(zStop: number) {
  const total = GALAXIES.reduce((n, g) => n + g.options.count, 0);
  const positions = new Float32Array(total * 3);
  const colors = new Float32Array(total * 3);
  let at = 0;
  for (const { seed, options, offset, tilt } of GALAXIES) {
    const stars = galaxyStars(seed, options);
    const [cx, sx, cy, sy] = [
      Math.cos(tilt[0]),
      Math.sin(tilt[0]),
      Math.cos(tilt[1]),
      Math.sin(tilt[1]),
    ];
    for (let i = 0; i < options.count; i++) {
      const x = stars.positions[i * 3] ?? 0;
      const y0 = stars.positions[i * 3 + 1] ?? 0;
      const z0 = stars.positions[i * 3 + 2] ?? 0;
      // About X, then about Y.
      const y = y0 * cx - z0 * sx;
      const z1 = y0 * sx + z0 * cx;
      const x2 = x * cy + z1 * sy;
      const z2 = -x * sy + z1 * cy;
      positions[at * 3] = offset[0] + x2;
      positions[at * 3 + 1] = offset[1] + y;
      positions[at * 3 + 2] = zStop + offset[2] + z2;
      colors.set(stars.colors.subarray(i * 3, i * 3 + 3), at * 3);
      at++;
    }
  }
  return { positions, colors };
}

export interface NebulaPreset {
  /** Centre relative to the heliopause stop's close point on the path. */
  offset: Vec3;
  /** Quad width (world units). */
  size: number;
  color: string;
  /** Noise offset, so each cloud differs. */
  seed: number;
}

export const NEBULAE: readonly NebulaPreset[] = [
  { offset: [-700, 250, -2800], size: 1700, color: '#3fa7a0', seed: 1.3 },
  { offset: [850, -150, -3200], size: 1500, color: '#b0467f', seed: 7.9 },
  { offset: [150, 650, -3700], size: 1800, color: '#c98a3c', seed: 4.4 },
];
