import type { ChasePose } from './camera';
import type { Vec3 } from './route';

/** Length of the intro sweep from the wide view into the chase view. */
export const INTRO_MS = 3000;

/** Offset of the wide intro camera from the point it looks at: behind, left and high. */
const WIDE_OFFSET: Vec3 = [-14, 11, 24];

/** Sweep progress (0..1) `elapsedMs` after Begin. */
export const introProgress = (elapsedMs: number): number =>
  Math.min(1, Math.max(0, elapsedMs / INTRO_MS));

const easeInOutCubic = (t: number): number => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

/** The wide, high establishing view of Earth and Voyager (at the origin) the sweep starts from. */
export function introStartPose(earth: Vec3): ChasePose {
  const lookAt: Vec3 = [earth[0] / 2, earth[1] / 2, earth[2] / 2];
  return {
    position: [lookAt[0] + WIDE_OFFSET[0], lookAt[1] + WIDE_OFFSET[1], lookAt[2] + WIDE_OFFSET[2]],
    lookAt,
  };
}

/**
 * Blends `out` (holding the chase pose) from `start` by eased sweep progress `t`: the start
 * pose at 0, the untouched chase pose at 1. Mutates and returns `out`.
 */
export function introPoseInto(out: ChasePose, start: ChasePose, t: number): ChasePose {
  if (t >= 1) return out;
  const w = easeInOutCubic(Math.max(0, t));
  for (let i = 0; i < 3; i++) {
    out.position[i] =
      (start.position[i] ?? 0) + ((out.position[i] ?? 0) - (start.position[i] ?? 0)) * w;
    out.lookAt[i] = (start.lookAt[i] ?? 0) + ((out.lookAt[i] ?? 0) - (start.lookAt[i] ?? 0)) * w;
  }
  return out;
}
