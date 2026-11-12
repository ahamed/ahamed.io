import { pointAt, type Route, type Vec3 } from './route';

export interface ChasePose {
  position: Vec3;
  lookAt: Vec3;
}

/** Camera offset from Voyager: above and behind (travel is toward -Z). */
const OFFSET: Vec3 = [0, 2.2, 7];
/** Point ahead of Voyager the camera looks at. */
const AIM: Vec3 = [0, 0.6, -10];
const ship: Vec3 = [0, 0, 0];

/** Writes the chase-camera pose for progress `p` into `out` without allocating. */
export function chasePoseInto(out: ChasePose, route: Route, p: number): ChasePose {
  pointAt(route, p, ship);
  for (let i = 0; i < 3; i++) {
    out.position[i] = (ship[i] ?? 0) + (OFFSET[i] ?? 0);
    out.lookAt[i] = (ship[i] ?? 0) + (AIM[i] ?? 0);
  }
  return out;
}

/** Writes `aim` blended toward `body` by `weight` (clamped to [0, 1]) into `out`. */
export function aimTowardInto(out: Vec3, aim: Vec3, body: Vec3, weight: number): Vec3 {
  const w = Math.min(1, Math.max(0, weight));
  for (let i = 0; i < 3; i++) out[i] = (aim[i] ?? 0) + ((body[i] ?? 0) - (aim[i] ?? 0)) * w;
  return out;
}

const LANDSCAPE_AIM = 0.25;
const PORTRAIT_AIM = 0.75;
/** Apparent size at which the aim reaches full strength. */
const FULL_AIM_SIZE = 0.3;

/**
 * How strongly the camera turns toward the nearest body: grows with its apparent size and is
 * stronger on portrait screens, whose narrow horizontal view would otherwise miss the body.
 */
export function aimWeight(bodySize: number, aspect: number): number {
  const nearness = Math.min(1, Math.max(0, bodySize / FULL_AIM_SIZE));
  const strength = aspect < 1 ? PORTRAIT_AIM : LANDSCAPE_AIM;
  return nearness * strength;
}
