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

/** Rate (1/s) at which the chase camera turns toward a new lap target. */
export const AIM_RATE = 3;

/**
 * Turns the unit look direction `dir` toward `target` as seen from `from`, damped at AIM_RATE
 * (immediate when `reduced`), so a change of lap target eases rather than snaps.
 */
export function aimDirInto(
  dir: Vec3,
  from: Vec3,
  target: Vec3,
  dt: number,
  reduced: boolean,
): Vec3 {
  const tx = target[0] - from[0];
  const ty = target[1] - from[1];
  const tz = target[2] - from[2];
  const tl = Math.hypot(tx, ty, tz) || 1;
  const k = reduced ? 1 : 1 - Math.exp(-AIM_RATE * Math.min(Math.max(dt, 0), 0.1));
  const x = dir[0] + (tx / tl - dir[0]) * k;
  const y = dir[1] + (ty / tl - dir[1]) * k;
  const z = dir[2] + (tz / tl - dir[2]) * k;
  const l = Math.hypot(x, y, z);
  if (l < 1e-9) {
    dir[0] = tx / tl;
    dir[1] = ty / tl;
    dir[2] = tz / tl;
  } else {
    dir[0] = x / l;
    dir[1] = y / l;
    dir[2] = z / l;
  }
  return dir;
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

/** Share of the leg to the lap target over which the camera frames into the orbit view. */
export const APPROACH_SHARE = 0.3;

/**
 * How far the camera has framed into the lap target's orbit view at progress `p`, on the leg
 * from `legFrom` to the target's capture point `cp`: 0 before the last APPROACH_SHARE of the
 * leg, smoothstep up to 1 at `cp`. A pure function of position, so travelling back reverses it.
 */
export function approachWeight(p: number, legFrom: number, cp: number): number {
  const span = APPROACH_SHARE * (cp - legFrom);
  if (span <= 0) return 1;
  const x = Math.min(1, Math.max(0, (p - (cp - span)) / span));
  return x * x * (3 - 2 * x);
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
