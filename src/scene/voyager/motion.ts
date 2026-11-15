/**
 * Pure Voyager motion: a smooth function of elapsed time (radians). The attitude holds a
 * deadband like the real craft: each axis drifts to about ±2°, then a short thruster pulse
 * reverses it. Pulses follow one shared schedule, so only one fires at a time. The scan
 * platform and booms sway on sines. No three.js imports.
 */

const DEG = Math.PI / 180;
const TAU = Math.PI * 2;

/** Attitude deadband (rad): each axis drifts to about ±2° before a thruster corrects it. */
export const DEADBAND = 2 * DEG;
/** Length of one thruster pulse (s), during which the drift reverses. */
export const PULSE = 0.3;
/** Gaps (s) between consecutive pulses, repeating; the axes take the pulses in turn. */
const GAPS = [8, 11, 9, 12, 10] as const;
/** `PREFIX[i]`: time of pulse i within one round of `GAPS`, from the round's start. */
const PREFIX = [8, 19, 28, 40, 50] as const;
const ROUND = 50;
/** Shifts the schedule so no pulse lands on load (t = 0): the last one before is at -2 s. */
const LEAD = 2;

const mod = (n: number, m: number) => ((n % m) + m) % m;

/** Start time (s) of global pulse `n` (any integer). The first pulse after load, n = 0, is at 6 s. */
export function pulseTime(n: number): number {
  return Math.floor(n / GAPS.length) * ROUND + (PREFIX[mod(n, GAPS.length)] ?? 0) - LEAD;
}

/** Axis (0 = X pitch, 1 = Y yaw, 2 = Z roll) that pulse `n` corrects. */
export const pulseAxis = (n: number): number => mod(n, 3);

/** Index of the latest pulse starting at or before `t`. */
export function pulseIndexAt(t: number): number {
  const round = Math.floor((t + LEAD) / ROUND);
  const within = t + LEAD - round * ROUND;
  let j = 0;
  while (j < PREFIX.length && (PREFIX[j] ?? Infinity) <= within) j++;
  return round * GAPS.length + j - 1;
}

/**
 * Nozzle (index into `NOZZLES`) that pushes each axis positive or negative. A rear nozzle at
 * (x, y) gives torque (y, -x, 0): the top one (k = 3) pitches +X, the left one (k = 6) yaws +Y.
 * The ring's axial nozzles cannot roll the craft, so roll uses a nominal pair (k = 1, 7).
 */
export const NOZZLE_FOR: Readonly<
  Record<0 | 1 | 2, { readonly positive: number; readonly negative: number }>
> = {
  0: { positive: 3, negative: 9 },
  1: { positive: 6, negative: 0 },
  2: { positive: 1, negative: 7 },
};

const PUFF_PEAK = 0.15;
const PUFF_END = 0.4;
const smooth = (x: number) => x * x * (3 - 2 * x);

/** A puff's brightness `age` seconds after its pulse began: up by 0.15 s, gone by 0.4 s. */
export function puffEnvelope(age: number): number {
  if (age <= 0 || age >= PUFF_END) return 0;
  return age < PUFF_PEAK
    ? smooth(age / PUFF_PEAK)
    : smooth(1 - (age - PUFF_PEAK) / (PUFF_END - PUFF_PEAK));
}

/** Sign of the extreme an axis reaches at its m-th pulse: it alternates +, -, +, … */
const extremeSign = (m: number) => (mod(m, 2) === 0 ? 1 : -1);

/** Time of the triangle vertex for pulse `n`: the middle of its window. */
const vertexTime = (n: number) => pulseTime(n) + PULSE / 2;

/** Value at `t` of the line between the vertices of axis pulses `n0` and `n0 + 3`. */
function lineAt(t: number, n0: number, m0: number): number {
  const t0 = vertexTime(n0);
  const t1 = vertexTime(n0 + 3);
  const a0 = extremeSign(m0) * DEADBAND;
  return a0 + ((-a0 - a0) * (t - t0)) / (t1 - t0);
}

/**
 * Deadband angle of `axis` at `t`: a triangle between the axis's own pulses, rounded inside
 * each pulse window by a quadratic Bézier whose control point is the vertex, so both angle
 * and rate are continuous.
 */
function deadbandAngle(axis: number, t: number, latest: number): number {
  const n = latest - mod(latest - axis, 3); // latest pulse of this axis at or before t
  const m = (n - axis) / 3;
  const start = pulseTime(n);
  if (t >= start + PULSE) return lineAt(t, n, m);
  const u = (t - start) / PULSE;
  const enter = lineAt(start, n - 3, m - 1);
  const leave = lineAt(start + PULSE, n, m);
  const vertex = extremeSign(m) * DEADBAND;
  return (1 - u) * (1 - u) * enter + 2 * u * (1 - u) * vertex + u * u * leave;
}

export interface VoyagerPose {
  /** Whole-craft attitude, Euler XYZ: a ±2° deadband cycle per axis. */
  attitude: [number, number, number];
  /** Scan platform azimuth (±25°, ~40 s cycle) and elevation (±6°). */
  scanPan: number;
  scanTilt: number;
  /** Whip antennas and magnetometer-boom tip sway (±1.5°). */
  whipL: number;
  whipR: number;
  magTip: number;
  /** Brightness (0..1) of each nozzle's puff, indexed like `NOZZLES`. */
  puffs: Float32Array;
  /** Index of the latest pulse begun (-1 under reduced motion): a change means a new pulse. */
  pulseCount: number;
}

export function createPose(): VoyagerPose {
  return {
    attitude: [0, 0, 0],
    scanPan: 0,
    scanTilt: 0,
    whipL: 0,
    whipR: 0,
    magTip: 0,
    puffs: new Float32Array(12),
    pulseCount: -1,
  };
}

const wave = (t: number, period: number, phase = 0) => Math.sin((TAU * t) / period + phase);

/** Writes the pose at time `t` (seconds) into `out` and returns it. Allocation-free. */
export function voyagerPoseInto(out: VoyagerPose, t: number, reduced: boolean): VoyagerPose {
  out.puffs.fill(0);
  if (reduced) {
    out.attitude[0] = 0;
    out.attitude[1] = 0;
    out.attitude[2] = 0;
    out.scanPan = 0;
    out.scanTilt = 0;
    out.whipL = 0;
    out.whipR = 0;
    out.magTip = 0;
    out.pulseCount = -1;
    return out;
  }
  const latest = pulseIndexAt(t);
  out.attitude[0] = deadbandAngle(0, t, latest);
  out.attitude[1] = deadbandAngle(1, t, latest);
  out.attitude[2] = deadbandAngle(2, t, latest);
  out.pulseCount = latest;
  const age = t - pulseTime(latest);
  if (age < PUFF_END) {
    const axis = pulseAxis(latest) as 0 | 1 | 2;
    // At its m-th pulse the axis has reached extremeSign(m); the thruster pushes back.
    const m = (latest - axis) / 3;
    const nozzle = extremeSign(m) > 0 ? NOZZLE_FOR[axis].negative : NOZZLE_FOR[axis].positive;
    out.puffs[nozzle] = puffEnvelope(age);
  }
  out.scanPan = 25 * DEG * wave(t, 40);
  out.scanTilt = 6 * DEG * wave(t, 55, 0.9);
  out.whipL = 1.5 * DEG * wave(t, 7, 0.3);
  out.whipR = 1.5 * DEG * wave(t, 7.6, 2.1);
  out.magTip = 1.5 * DEG * wave(t, 9.3, 1.4);
  return out;
}
