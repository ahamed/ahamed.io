import type { ChasePose } from './camera';
import type { Vec3 } from './route';

/** Progress where the camera starts orbiting round Voyager (the heliopause stop is at 0.8). */
export const TURN_START = 0.86;
/** Progress where the camera has reached Voyager's front, facing Earth. */
export const TURN_END = 0.95;
/** The caption and the contact card fade in over this range, after the turn. */
const REVEAL_START = 0.95;
const REVEAL_END = 0.99;
/** The Pale Blue Dot and its bracket show once the look-back turn is past this point. */
export const DOT_FROM_TURN = 0.5;

/** Sideways shift (world units, −X is the final view's right) of the camera in the final view. */
const END_SIDE = -2.5;
/** How far beyond the camera, toward Earth, the final view aims. */
const AIM_DISTANCE = 40;
/** Drops the final aim so Earth sits above the centre of the frame and the card below it. */
const AIM_DROP = -6;

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

/** How far the look-back turn has gone at progress `p` (0 = chase view, 1 = facing Earth). */
export const finaleTurn = (p: number): number => smoothstep(TURN_START, TURN_END, p);

/** Opacity of the caption and the contact card at progress `p`. */
export const finaleReveal = (p: number): number => smoothstep(REVEAL_START, REVEAL_END, p);

/**
 * Orbits the chase pose in `out` round `ship` by half a turn × `turn`, and blends its aim toward
 * `earth`. At `turn` 0 it leaves `out` untouched; at 1 the camera is in front of Voyager,
 * facing back toward Earth with Voyager in the foreground. Mutates and returns `out`.
 */
export function finalePoseInto(out: ChasePose, ship: Vec3, turn: number, earth: Vec3): ChasePose {
  if (turn <= 0) return out;
  const theta = Math.PI * turn;
  const cos = Math.cos(theta);
  const sin = Math.sin(theta);
  const dx = out.position[0] - ship[0];
  const dz = out.position[2] - ship[2];
  out.position[0] = ship[0] + dx * cos + dz * sin + END_SIDE * turn;
  out.position[2] = ship[2] - dx * sin + dz * cos;

  const ex = earth[0] - out.position[0];
  const ey = earth[1] - out.position[1];
  const ez = earth[2] - out.position[2];
  const length = Math.hypot(ex, ey, ez) || 1;
  const aimX = out.position[0] + (ex / length) * AIM_DISTANCE;
  const aimY = out.position[1] + (ey / length) * AIM_DISTANCE + AIM_DROP;
  const aimZ = out.position[2] + (ez / length) * AIM_DISTANCE;
  out.lookAt[0] += (aimX - out.lookAt[0]) * turn;
  out.lookAt[1] += (aimY - out.lookAt[1]) * turn;
  out.lookAt[2] += (aimZ - out.lookAt[2]) * turn;
  return out;
}
