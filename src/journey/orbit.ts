import { countWords } from '../content/words';
import type { Route, RouteBody, Vec3 } from './route';

/** Characters the typewriter reveals per second of orbit clock at 1×. */
export const TYPE_CPS = 60;
/** Clock time a lap keeps going after the text is fully typed. */
export const LAP_REST_MS = 2500;
/** Shortest reduced-motion hold at a stop. */
export const MIN_READ_MS = 4000;
const WORDS_PER_MINUTE = 200;

/** Typing time of `text` on the orbit clock at 1×. */
export const typingMs = (text: string): number => (text.length / TYPE_CPS) * 1000;

/** Orbit-clock length of a lap: the typing time, then the rest. */
export const lapMs = (text: string): number => typingMs(text) + LAP_REST_MS;

/** Characters shown after `clockMs` of orbit clock, for a text of `length` characters. */
export function revealAt(clockMs: number, length: number): number {
  const count = Math.floor((Math.max(0, clockMs) * TYPE_CPS) / 1000);
  return Math.min(length, count);
}

/** Reading time at 200 words a minute, at least 4 s: the reduced-motion hold. */
export function readingMs(text: string): number {
  return Math.max(MIN_READ_MS, (countWords(text) / WORDS_PER_MINUTE) * 60_000);
}

export interface LapPose {
  position: Vec3;
  /** Unit direction of travel. */
  heading: Vec3;
}

/** Progress where Voyager is level with stop `i`'s body centre: the lap joins the route there. */
export function capturePoint(route: Route, i: number): number {
  const body = route.bodies[i];
  return body ? -body.position[2] / route.length : 0;
}

/** The lap's radius: the distance the route passes the body at. */
export const lapRadius = (body: RouteBody): number => Math.abs(body.position[0]);

/**
 * Writes Voyager's pose at lap angle `theta` (0..2π) round `body` into `out`. At 0 and 2π it is
 * the capture point heading −Z, so joining and leaving the route needs no turn. Allocation-free.
 */
export function lapPoseInto(out: LapPose, body: RouteBody, R: number, theta: number): LapPose {
  const side = body.position[0] >= 0 ? 1 : -1;
  const c = Math.cos(theta);
  const s = Math.sin(theta);
  out.position[0] = body.position[0] - side * R * c;
  out.position[1] = body.position[1];
  out.position[2] = body.position[2] - R * s;
  out.heading[0] = side * s;
  out.heading[1] = 0;
  out.heading[2] = -c;
  return out;
}

const TAU = Math.PI * 2;
/** Share of the lap at each end over which the angular rate ramps to and from its middle rate. */
const RAMP_SHARE = 0.12;
/** Lowest middle rate, as a share of the mean rate, so a fast entry cannot stall the lap. */
const MIN_MID_SHARE = 0.2;

/**
 * Lap angle (rad) `t` seconds into a lap lasting `T` seconds. The rate ramps linearly from
 * `entryRate` to a constant middle rate and then to `exitRate` (rad/s), so the angle is C¹ and
 * matches the speeds Voyager arrives and leaves with. Clamped to [0, 2π].
 */
export function lapAngleAt(t: number, T: number, entryRate: number, exitRate: number): number {
  if (T <= 0 || t >= T) return TAU;
  if (t <= 0) return 0;
  const a = RAMP_SHARE * T;
  const mean = TAU / T;
  let e = Math.max(0, entryRate);
  let x = Math.max(0, exitRate);
  let mid = (TAU - (a * (e + x)) / 2) / (T - a);
  const floor = MIN_MID_SHARE * mean;
  if (mid < floor) {
    // Too fast to fit: scale the end rates down so the middle keeps a minimum rate.
    const scale = (2 * (TAU - floor * (T - a))) / (a * (e + x));
    e *= scale;
    x *= scale;
    mid = floor;
  }
  if (t < a) return e * t + ((mid - e) * t * t) / (2 * a);
  const start = (a * (e + mid)) / 2;
  if (t <= T - a) return start + mid * (t - a);
  const r = T - t;
  return TAU - (x * r + ((mid - x) * r * r) / (2 * a));
}
