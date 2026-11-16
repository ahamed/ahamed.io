import { VOYAGER_ORIENTATION } from './orientation';

/**
 * Voyager's attitude target (no three.js imports). Cruise holds the fixed three-quarter back
 * orientation; during a capture the dish turns to face the orbited body; in the finale it turns
 * to face Earth. A critically damped weight eases between them, so the turn starts and ends
 * gently, while the body-facing attitude itself is recomputed every frame, so once turned the
 * dish tracks the body exactly. The craft never rolls.
 */

type Vec3 = [number, number, number];
export type Quat = [number, number, number, number];

export const TURN_START = 1;
export const TURN_END = 2;

/** Seconds a full turn takes; the weight follows a smoothstep, so it starts and ends at rest. */
const TURN_S = 2.5;
const smooth = (x: number) => x * x * (3 - 2 * x);

/**
 * Writes Euler XYZ angles (pitch, yaw, 0) that point the dish along unit `dir` into `out`. The
 * yaw stays on the branch of the cruise orientation (dish ahead, bus toward the chase camera),
 * so a turn never flips the craft over.
 */
export function attitudeAnglesInto(out: Vec3, dir: Readonly<Vec3>): Vec3 {
  const x = Math.min(1, Math.max(-1, dir[0]));
  out[0] = Math.atan2(dir[1], -dir[2]);
  out[1] = Math.PI - Math.asin(x);
  out[2] = 0;
  return out;
}

/** Writes the quaternion of Euler XYZ (x, y, 0) into `out`, as three.js composes it. */
function eulerQuatInto(out: Quat, x: number, y: number): Quat {
  const c1 = Math.cos(x / 2);
  const s1 = Math.sin(x / 2);
  const c2 = Math.cos(y / 2);
  const s2 = Math.sin(y / 2);
  out[0] = s1 * c2;
  out[1] = c1 * s2;
  out[2] = s1 * s2;
  out[3] = c1 * c2;
  return out;
}

/** Spherical interpolation from `a` to `b` by `t`, written into `out` (may alias `a`). */
function slerpInto(out: Quat, a: Readonly<Quat>, b: Readonly<Quat>, t: number): Quat {
  let [bx, by, bz, bw] = b;
  let dot = a[0] * bx + a[1] * by + a[2] * bz + a[3] * bw;
  if (dot < 0) {
    dot = -dot;
    bx = -bx;
    by = -by;
    bz = -bz;
    bw = -bw;
  }
  let wa = 1 - t;
  let wb = t;
  if (dot < 0.9995) {
    const theta = Math.acos(dot);
    const sin = Math.sin(theta);
    wa = Math.sin((1 - t) * theta) / sin;
    wb = Math.sin(t * theta) / sin;
  }
  const x = wa * a[0] + wb * bx;
  const y = wa * a[1] + wb * by;
  const z = wa * a[2] + wb * bz;
  const w = wa * a[3] + wb * bw;
  const len = Math.hypot(x, y, z, w) || 1;
  out[0] = x / len;
  out[1] = y / len;
  out[2] = z / len;
  out[3] = w / len;
  return out;
}

/** Angle (rad) between two orientations. */
export function quatAngle(a: Readonly<Quat>, b: Readonly<Quat>): number {
  const dot = Math.abs(a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3]);
  return 2 * Math.acos(Math.min(1, dot));
}

export interface AttitudeInput {
  /** Unit direction from Voyager to the body it is captured at, or null. */
  body: Readonly<Vec3> | null;
  /** Unit direction from Voyager to Earth. */
  earth: Readonly<Vec3>;
  /** Finale turn, 0..1 (driven by progress). */
  finale: number;
  reduced: boolean;
}

export interface AttitudeState {
  /** The orientation to apply, as a quaternion. */
  quat: Quat;
  /** Turn weight toward the body (0 cruise, 1 facing it): `smooth(progress)`. */
  weight: number;
  /** Linear turn progress (0..1) behind the weight. */
  progress: number;
  /** Whether a turn is under way (between its start and end events). */
  turning: boolean;
  /** Finale turn last frame. */
  finale: number;
  /** +1 when the latest turn yaws the craft positive, −1 when negative. */
  turnSign: 1 | -1;
  cruise: Quat;
  bodyQuat: Quat;
  earthQuat: Quat;
  angles: Vec3;
}

export function createAttitude(): AttitudeState {
  const cruise = eulerQuatInto([0, 0, 0, 1], VOYAGER_ORIENTATION[0], VOYAGER_ORIENTATION[1]);
  return {
    quat: [...cruise],
    weight: 0,
    progress: 0,
    turning: false,
    finale: 0,
    turnSign: 1,
    cruise,
    bodyQuat: [...cruise],
    earthQuat: [...cruise],
    angles: [0, 0, 0],
  };
}

/** Advances the attitude by `dt` and returns TURN_START / TURN_END bits. Allocation-free. */
export function stepAttitudeInto(s: AttitudeState, input: AttitudeInput, dt: number): number {
  let events = 0;
  const goal = input.body ? 1 : 0;
  if (input.body) {
    attitudeAnglesInto(s.angles, input.body);
    eulerQuatInto(s.bodyQuat, s.angles[0], s.angles[1]);
  }
  attitudeAnglesInto(s.angles, input.earth);
  eulerQuatInto(s.earthQuat, s.angles[0], s.angles[1]);

  if (input.reduced) {
    s.progress = goal;
    s.turning = false;
  } else {
    if (s.progress !== goal && !s.turning) {
      s.turning = true;
      events |= TURN_START;
      s.turnSign = goal > s.progress ? 1 : -1;
    }
    const step = Math.min(Math.max(dt, 0), 0.1) / TURN_S;
    s.progress =
      goal > s.progress ? Math.min(goal, s.progress + step) : Math.max(goal, s.progress - step);
    if (s.progress === goal && s.turning) {
      s.turning = false;
      events |= TURN_END;
    }
  }
  s.weight = smooth(s.progress);

  const finale = Math.min(1, Math.max(0, input.finale));
  if (!input.reduced) {
    if (finale > 0 && s.finale <= 0) events |= TURN_START;
    if (finale >= 1 && s.finale < 1) events |= TURN_END;
  }
  s.finale = finale;
  slerpInto(s.quat, s.cruise, s.earthQuat, finale);
  if (s.weight > 0) slerpInto(s.quat, s.quat, s.bodyQuat, s.weight);
  return events;
}
