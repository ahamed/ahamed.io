import type { Vec3 } from '../../journey/route';
import { SKY_RADIUS } from './layout';

/**
 * Meteor schedule and paths (no three.js imports). One meteor at a time: each starts 6 to 15 s
 * after the previous one and lasts under a second, so they never overlap and one streak
 * suffices. Paths lie on a far background sphere around the camera, in the forward view.
 */

/** Background sphere radius for the streaks, inside the sky and stars. */
export const METEOR_RADIUS = 0.9 * SKY_RADIUS;
const GAP_MIN = 6;
const GAP_SPAN = 9;
const DURATION_MIN = 0.5;
const DURATION_SPAN = 0.4;
const deg = (d: number) => (d * Math.PI) / 180;

export interface MeteorState {
  active: boolean;
  /** 0 → 1 over the meteor's life. */
  progress: number;
  /** Start and end of the streak, relative to the camera. */
  start: Vec3;
  end: Vec3;
}

export const emptyMeteor = (): MeteorState => ({
  active: false,
  progress: 0,
  start: [0, 0, 0],
  end: [0, 0, 0],
});

/** Integer hash → [0, 1) for meteor `k` and channel `salt` (no allocation). */
function hash(seed: number, k: number, salt: number): number {
  let h =
    Math.imul(seed ^ 0x9e3779b9, 0x85ebca6b) ^ Math.imul(k + 1, 0xc2b2ae35) ^ (salt * 0x27d4eb2f);
  h = Math.imul(h ^ (h >>> 16), 0x7feb352d);
  h = Math.imul(h ^ (h >>> 15), 0x846ca68b);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

function direction(out: Vec3, azimuth: number, elevation: number): Vec3 {
  out[0] = Math.sin(azimuth) * Math.cos(elevation) * METEOR_RADIUS;
  out[1] = Math.sin(elevation) * METEOR_RADIUS;
  out[2] = -Math.cos(azimuth) * Math.cos(elevation) * METEOR_RADIUS;
  return out;
}

/** A seeded meteor schedule. `stateAt` keeps a cursor, so moving forward in time is cheap. */
export function createMeteorClock(seed: number) {
  const gap = (k: number) => GAP_MIN + GAP_SPAN * hash(seed, k, 1);
  let k = 0;
  let startK = gap(0);
  return {
    stateAt(t: number, out: MeteorState): MeteorState {
      if (t < startK - gap(k)) {
        k = 0;
        startK = gap(0);
      }
      while (t >= startK + gap(k + 1)) {
        k++;
        startK += gap(k);
      }
      const duration = DURATION_MIN + DURATION_SPAN * hash(seed, k, 2);
      const age = t - startK;
      out.active = age >= 0 && age < duration;
      out.progress = out.active ? age / duration : 0;
      // Start within 35° of the travel direction, 5–25° above the horizon.
      const azimuth = deg(-35 + 70 * hash(seed, k, 3));
      const elevation = deg(5 + 20 * hash(seed, k, 4));
      // Travel 8–15°, heading 20–70° below the horizontal, left or right.
      const length = deg(8 + 7 * hash(seed, k, 5));
      const heading = deg(20 + 50 * hash(seed, k, 6));
      const side = hash(seed, k, 7) < 0.5 ? -1 : 1;
      direction(out.start, azimuth, elevation);
      direction(
        out.end,
        azimuth + (side * length * Math.cos(heading)) / Math.cos(elevation),
        elevation - length * Math.sin(heading),
      );
      return out;
    },
  };
}
