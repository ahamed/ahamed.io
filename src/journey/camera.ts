import { pointAt, type Route, type RouteBody, type Vec3 } from './route';

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

/** Camera elevation above the lap's plane in the orbit view. */
export const ORBIT_ELEVATION = (35 * Math.PI) / 180;
/** Room kept round the lap in the orbit view. */
const ORBIT_MARGIN = 1.2;

/**
 * Writes the orbit view of a lap of radius `R` round `body` into `out`: behind the lap (+Z),
 * looking down at the body from ORBIT_ELEVATION, far enough that the lap (and the body's disc)
 * fit a viewing area of aspect `aspect` with vertical field of view `fovY`.
 */
export function orbitPoseInto(
  out: ChasePose,
  body: RouteBody,
  R: number,
  fovY: number,
  aspect: number,
): ChasePose {
  const halfY = Math.tan(fovY / 2);
  const halfX = halfY * aspect;
  const s = Math.sin(ORBIT_ELEVATION);
  const c = Math.cos(ORBIT_ELEVATION);
  const reach = ORBIT_MARGIN * R;
  // Perspective: the lap's near edge is `R·c` closer, so fit against that depth.
  const wide = reach / halfX + reach * c;
  const tall = (ORBIT_MARGIN * Math.max(R * s, body.footprint)) / halfY + reach * c;
  const d = Math.max(wide, tall);
  const [bx, by, bz] = body.position;
  out.position[0] = bx;
  out.position[1] = by + d * s;
  out.position[2] = bz + d * c;
  out.lookAt[0] = bx;
  out.lookAt[1] = by;
  out.lookAt[2] = bz;
  return out;
}

export interface ViewArea {
  /** Aspect of the space the lap is framed in. */
  aspect: number;
  /** Vertical field of view across that space. */
  fovY: number;
  /** `setViewOffset` x and y (px) that centre the look-at in that space. */
  offsetX: number;
  offsetY: number;
}

/**
 * The space the orbit view frames its lap in: the viewport less the docked dialog's column
 * (`dock` px on the left) or the bottom sheet (`sheet` px), and the view offset that centres the
 * look-at there, scaled by the capture `weight`.
 */
export function viewAreaInto(
  out: ViewArea,
  viewport: { w: number; h: number },
  covered: { dock: number; sheet: number },
  fovY: number,
  weight: number,
): ViewArea {
  const w = Math.max(1, viewport.w - covered.dock);
  const h = Math.max(1, viewport.h - covered.sheet);
  out.aspect = w / h;
  out.fovY = 2 * Math.atan(Math.tan(fovY / 2) * (h / Math.max(1, viewport.h)));
  out.offsetX = weight === 0 ? 0 : (-covered.dock / 2) * weight;
  out.offsetY = weight === 0 ? 0 : (covered.sheet / 2) * weight;
  return out;
}
