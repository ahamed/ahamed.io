import { damp } from './progress';

/** How long (ms) after the last wheel/touch event the throttle still counts as held. */
export const THROTTLE_HOLD_MS = 150;
/** Seconds the cruise takes to cross the mean gap between stops. */
const SECONDS_PER_GAP = 4;
/** Speed easing rate (1/s): settles within about half a second. */
const SPEED_RATE = 8;
/** Boost easing rate (1/s) back toward its target. */
const BOOST_RATE = 6;
/** Highest orbit-clock rate that scrolling can reach. */
export const MAX_BOOST = 2.5;
/** Wheel speed (px/s) that counts as full intensity. */
const FULL_WHEEL_PX_PER_S = 3000;
/** Intensity of a held ↑/↓ key. */
export const KEY_INTENSITY = 0.5;

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));

/** Cruise speed (progress per second): the mean close-point gap in 4 s. */
export function cruiseSpeed(closePoints: readonly number[]): number {
  const n = closePoints.length;
  if (n < 2) return 1 / (SECONDS_PER_GAP * 10);
  const span = (closePoints[n - 1] ?? 0) - (closePoints[0] ?? 0);
  return span / (n - 1) / SECONDS_PER_GAP;
}

/** Whether input whose last event was at `lastAt` still holds the throttle at `now`. */
export const inputActive = (now: number, lastAt: number): boolean =>
  now - lastAt < THROTTLE_HOLD_MS;

/** One frame of speed easing toward `dir · cruise` (`dir` 0 when idle). */
export const throttleSpeed = (current: number, dir: -1 | 0 | 1, cruise: number, dt: number) =>
  damp(current, dir * cruise, SPEED_RATE, dt);

/** Orbit-clock rate for an input intensity (0..1, more is clamped). */
export const boostFor = (intensity: number): number => 1 + (MAX_BOOST - 1) * clamp01(intensity);

/** One frame of boost easing toward `target`. */
export const dampBoost = (current: number, target: number, dt: number): number =>
  damp(current, target, BOOST_RATE, dt);

/** Intensity of wheel input scrolling at `pxPerSec`. */
export const wheelIntensity = (pxPerSec: number): number =>
  Math.max(0, pxPerSec) / FULL_WHEEL_PX_PER_S;

/** Longest gap (ms) between events still read as one gesture; also used for a first event. */
const MAX_EVENT_GAP_MS = 250;

/** Speed (px/s) of an input that moved `px` since the previous event `dtMs` ago. */
export const eventRate = (px: number, dtMs: number): number =>
  (Math.abs(px) * 1000) / Math.min(MAX_EVENT_GAP_MS, Math.max(16, dtMs));
