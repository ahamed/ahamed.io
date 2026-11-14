import type { Vec3 } from '../../journey/route';
import { SUN_DIRECTION } from '../space/sunDirection';

/**
 * Comet tail particles (no three.js imports). Each particle streams from the nucleus along the
 * anti-sun direction and loops; the GLSL copy below runs the same maths in the vertex shader,
 * so the tails need no per-frame CPU work.
 */

export type TailKind = 'ion' | 'dust';

export interface TailParams {
  /** Tail length (world units). */
  length: number;
  /** Loops per second of one particle's journey from nucleus to tip. */
  rate: number;
  /** Sideways spread at the tip, as a share of the length. */
  spread: number;
  /** Sideways bend at the tip along TAIL_LATERAL, as a share of the length (dust only). */
  curve: number;
  /** Particle count. */
  count: number;
  /** Colour (sRGB hex). */
  color: string;
  /** Peak particle opacity. */
  brightness: number;
  /** Particle diameter (world units) at the nucleus; it grows along the tail. */
  size: number;
}

const normalize = (v: Vec3): Vec3 => {
  const l = Math.hypot(...v);
  return [v[0] / l, v[1] / l, v[2] / l];
};
const cross = (a: Vec3, b: Vec3): Vec3 => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];

/** Tails point directly away from the Sun. */
export const ANTI_SUN: Vec3 = normalize([-SUN_DIRECTION[0], -SUN_DIRECTION[1], -SUN_DIRECTION[2]]);
/** The dust tail bends this way: perpendicular to the anti-sun line and away from the path (+X). */
export const TAIL_LATERAL: Vec3 = normalize(cross(ANTI_SUN, [0, 1, 0]));
/** Completes the tail's frame, for the second jitter axis. */
export const TAIL_NORMAL: Vec3 = normalize(cross(ANTI_SUN, TAIL_LATERAL));

const ION: TailParams = {
  length: 70,
  rate: 0.05,
  spread: 0.02,
  curve: 0,
  count: 1500,
  color: '#7fb3ff',
  brightness: 0.25,
  size: 0.5,
};
const DUST: TailParams = {
  length: 50,
  rate: 0.03,
  spread: 0.12,
  curve: 0.3,
  count: 2500,
  color: '#ffd9a0',
  brightness: 0.15,
  size: 0.9,
};

const fainter = (p: TailParams): TailParams => ({
  ...p,
  length: p.length * 0.45,
  brightness: p.brightness * 0.5,
  count: Math.round(p.count * 0.5),
});

/** The two agent comets are bright; the upcoming comet, still far from the Sun, is faint. */
export const COMET_PRESETS = {
  bright: { ion: ION, dust: DUST },
  faint: { ion: fainter(ION), dust: fainter(DUST) },
} satisfies Record<string, Record<TailKind, TailParams>>;

const fract = (x: number) => x - Math.floor(x);

/**
 * Offset from the nucleus of the particle with `seed` (0..1) and `jitter` (each in -1..1) at
 * time `t` seconds. Its age runs 0 → 1 from the nucleus to the tip and then loops.
 */
export function tailParticle(
  kind: TailKind,
  seed: number,
  jitter: readonly [number, number],
  t: number,
  { length, rate, spread, curve }: TailParams,
): Vec3 {
  const age = fract(seed + t * rate);
  const along = age * length;
  const side = spread * length * age;
  const bend = kind === 'dust' ? curve * age * age * length : 0;
  const out: Vec3 = [0, 0, 0];
  for (let i = 0; i < 3; i++) {
    out[i] =
      (ANTI_SUN[i] ?? 0) * along +
      (TAIL_LATERAL[i] ?? 0) * (side * jitter[0] + bend) +
      (TAIL_NORMAL[i] ?? 0) * side * jitter[1];
  }
  return out;
}

const vec3 = (v: Vec3) => `vec3(${v.map((x) => x.toFixed(6)).join(', ')})`;

/**
 * GLSL twin of `tailParticle` (`vec3 tailParticle(float seed, vec2 jitter, float t)`), for one
 * tail kind; tail parameters come in as uniforms.
 */
export const tailParticleGlsl = (kind: TailKind) => /* glsl */ `
uniform float uLength;
uniform float uRate;
uniform float uSpread;
uniform float uCurve;
float tailAge(float seed, float t) { return fract(seed + t * uRate); }
vec3 tailParticle(float seed, vec2 jitter, float t) {
  float age = tailAge(seed, t);
  float side = uSpread * uLength * age;
  float bend = ${kind === 'dust' ? 'uCurve * age * age * uLength' : '0.0'};
  return ${vec3(ANTI_SUN)} * age * uLength
    + ${vec3(TAIL_LATERAL)} * (side * jitter.x + bend)
    + ${vec3(TAIL_NORMAL)} * side * jitter.y;
}
`;
