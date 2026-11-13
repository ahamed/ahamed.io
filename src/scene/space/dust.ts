/** Speed-dust math (no three.js imports). The dust shader mirrors `wrapInto`. */
import type { Vec3 } from '../../journey/route';
import { mulberry32 } from '../random';

/** Below this eased speed (progress per second) the dust is off. */
const DEAD_ZONE = 0.002;
/** At or above this speed the dust is at full strength. */
const FULL_SPEED = 0.25;

export const DUST_LIMITS = { opacity: 0.35, stretch: 6 } as const;

export interface DustResponse {
  opacity: number;
  /** Streak length in world units. */
  stretch: number;
}

/** Seeded particle offsets, xyz each in [−box/2, box/2]. */
export function createDust(count = 1500, seed = 4242, box = 60): Float32Array {
  const rand = mulberry32(seed);
  const out = new Float32Array(count * 3);
  for (let i = 0; i < out.length; i++) out[i] = (rand() - 0.5) * box;
  return out;
}

const wrap = (base: number, camera: number, box: number): number => {
  const d = base - camera + box / 2;
  return d - Math.floor(d / box) * box - box / 2 + camera;
};

/** World position of a particle: its base point repeated every `box`, nearest the camera. */
export function wrapInto(out: Vec3, base: Readonly<Vec3>, camera: Readonly<Vec3>, box: number) {
  out[0] = wrap(base[0], camera[0], box);
  out[1] = wrap(base[1], camera[1], box);
  out[2] = wrap(base[2], camera[2], box);
  return out;
}

/** Opacity and streak length for an eased travel speed (progress per second). */
export function dustResponse(speed: number): DustResponse {
  if (!(speed > DEAD_ZONE)) return { opacity: 0, stretch: 0 };
  const t = Math.min(1, (speed - DEAD_ZONE) / (FULL_SPEED - DEAD_ZONE));
  const s = t * t * (3 - 2 * t);
  return { opacity: DUST_LIMITS.opacity * s, stretch: DUST_LIMITS.stretch * s };
}
