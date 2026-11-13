/**
 * Pure Voyager motion: a smooth function of elapsed time (radians), built from sines with
 * incommensurate periods so it never visibly repeats. No three.js imports.
 */

const DEG = Math.PI / 180;
const TAU = Math.PI * 2;

export interface VoyagerPose {
  /** Whole-craft attitude drift, Euler XYZ. Each axis stays within ±0.45°. */
  attitude: [number, number, number];
  /** Scan platform azimuth (±25°, ~40 s cycle) and elevation (±6°). */
  scanPan: number;
  scanTilt: number;
  /** Whip antennas and magnetometer-boom tip sway (±1.5°). */
  whipL: number;
  whipR: number;
  magTip: number;
}

export function createPose(): VoyagerPose {
  return { attitude: [0, 0, 0], scanPan: 0, scanTilt: 0, whipL: 0, whipR: 0, magTip: 0 };
}

const wave = (t: number, period: number, phase = 0) => Math.sin((TAU * t) / period + phase);

/** Writes the pose at time `t` (seconds) into `out` and returns it. Allocation-free. */
export function voyagerPoseInto(out: VoyagerPose, t: number, reduced: boolean): VoyagerPose {
  if (reduced) {
    out.attitude[0] = 0;
    out.attitude[1] = 0;
    out.attitude[2] = 0;
    out.scanPan = 0;
    out.scanTilt = 0;
    out.whipL = 0;
    out.whipR = 0;
    out.magTip = 0;
    return out;
  }
  out.attitude[0] = 0.3 * DEG * wave(t, 23) + 0.15 * DEG * wave(t, 37, 1.1);
  out.attitude[1] = 0.3 * DEG * wave(t, 29, 0.7) + 0.15 * DEG * wave(t, 41, 2.3);
  out.attitude[2] = 0.3 * DEG * wave(t, 31, 1.9) + 0.15 * DEG * wave(t, 43, 0.4);
  out.scanPan = 25 * DEG * wave(t, 40);
  out.scanTilt = 6 * DEG * wave(t, 55, 0.9);
  out.whipL = 1.5 * DEG * wave(t, 7, 0.3);
  out.whipR = 1.5 * DEG * wave(t, 7.6, 2.1);
  out.magTip = 1.5 * DEG * wave(t, 9.3, 1.4);
  return out;
}
