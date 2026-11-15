import { describe, expect, it } from 'vitest';
import {
  createPose,
  DEADBAND,
  NOZZLE_FOR,
  PULSE,
  pulseAxis,
  pulseIndexAt,
  pulseTime,
  puffEnvelope,
  voyagerPoseInto,
  type VoyagerPose,
} from './motion';
import { NOZZLES, PARTS } from './parts';

const DEG = Math.PI / 180;

function angles(p: VoyagerPose): number[] {
  return [
    p.attitude[0],
    p.attitude[1],
    p.attitude[2],
    p.scanPan,
    p.scanTilt,
    p.whipL,
    p.whipR,
    p.magTip,
  ];
}

describe('voyagerPoseInto', () => {
  it('keeps every angle in bounds over ten minutes', () => {
    const pose = createPose();
    let maxPan = 0;
    for (let t = 0; t <= 600; t += 0.05) {
      voyagerPoseInto(pose, t, false);
      maxPan = Math.max(maxPan, Math.abs(pose.scanPan));
      expect(Math.abs(pose.scanPan)).toBeLessThanOrEqual(25 * DEG + 1e-9);
      for (const a of pose.attitude) expect(Math.abs(a)).toBeLessThanOrEqual(2.1 * DEG);
      for (const s of [pose.whipL, pose.whipR, pose.magTip]) {
        expect(Math.abs(s)).toBeLessThanOrEqual(2 * DEG);
      }
    }
    // The platform really does slew across most of its range.
    expect(maxPan).toBeGreaterThan(20 * DEG);
  });

  it('is smooth: frames 1/60 s apart differ only slightly', () => {
    const a = createPose();
    const b = createPose();
    for (let t = 0; t <= 120; t += 0.37) {
      const before = angles(voyagerPoseInto(a, t, false));
      const after = angles(voyagerPoseInto(b, t + 1 / 60, false));
      before.forEach((v, i) => {
        expect(Math.abs((after[i] ?? 0) - v)).toBeLessThan(0.01);
      });
    }
  });

  it('is a pure function of time, written into the given object', () => {
    const out = createPose();
    const returned = voyagerPoseInto(out, 12.5, false);
    expect(returned).toBe(out);
    const again = voyagerPoseInto(createPose(), 12.5, false);
    expect(angles(again)).toEqual(angles(out));
  });

  it('rests in the neutral pose under reduced motion', () => {
    const pose = createPose();
    for (const t of [0, 3.3, 47, 599]) {
      voyagerPoseInto(pose, t, true);
      for (const v of angles(pose)) expect(v).toBe(0);
    }
  });

  it('actually moves when motion is allowed', () => {
    const a = angles(voyagerPoseInto(createPose(), 1, false));
    const b = angles(voyagerPoseInto(createPose(), 9, false));
    expect(a).not.toEqual(b);
  });
});

describe('thruster pulse schedule', () => {
  it('fires on a repeating 8, 11, 9, 12, 10 s pattern, axes in turn X, Y, Z', () => {
    const gaps = [1, 2, 3, 4, 5].map((n) => pulseTime(n) - pulseTime(n - 1));
    expect(gaps).toEqual([11, 9, 12, 10, 8]);
    expect(pulseTime(15) - pulseTime(0)).toBe(150);
    expect([0, 1, 2, 3, 4, 5].map(pulseAxis)).toEqual([0, 1, 2, 0, 1, 2]);
    expect(pulseAxis(-1)).toBe(2);
    // Nothing fires the moment the page loads.
    expect(pulseTime(0)).toBe(6);
    expect(pulseTime(-1)).toBeLessThan(-PULSE - 0.4);
    expect(pulseIndexAt(0)).toBe(-1);
    for (const v of voyagerPoseInto(createPose(), 0, false).puffs) expect(v).toBe(0);
  });

  it('finds the latest pulse at or before a time', () => {
    for (let n = -3; n < 40; n++) {
      expect(pulseIndexAt(pulseTime(n))).toBe(n);
      expect(pulseIndexAt(pulseTime(n) - 1e-6)).toBe(n - 1);
    }
  });

  it('averages 8–12 s between pulses, one pulse at a time', () => {
    const starts: number[] = [];
    for (let n = 0; pulseTime(n) <= 600; n++) starts.push(pulseTime(n));
    const mean = ((starts.at(-1) ?? 0) - (starts[0] ?? 0)) / (starts.length - 1);
    expect(mean).toBeGreaterThanOrEqual(8);
    expect(mean).toBeLessThanOrEqual(12);
    for (let i = 1; i < starts.length; i++) {
      expect((starts[i] ?? 0) - (starts[i - 1] ?? 0)).toBeGreaterThan(PULSE);
    }
  });
});

describe('deadband attitude', () => {
  const sample = (t: number) => [...voyagerPoseInto(createPose(), t, false).attitude];

  it('stays in the ±2° deadband and reaches most of it', () => {
    let peak = 0;
    for (let t = 0; t <= 600; t += 0.05) {
      for (const a of sample(t)) {
        expect(Math.abs(a)).toBeLessThanOrEqual(DEADBAND + 1e-9);
        peak = Math.max(peak, Math.abs(a));
      }
    }
    expect(DEADBAND).toBeCloseTo(2 * DEG, 9);
    expect(peak).toBeGreaterThan(1.8 * DEG);
  });

  it('is smooth through every pulse', () => {
    for (let n = 0; n < 20; n++) {
      for (let t = pulseTime(n) - 0.1; t < pulseTime(n) + PULSE + 0.1; t += 1 / 120) {
        const a = sample(t);
        const b = sample(t + 1 / 60);
        a.forEach((v, i) => {
          expect(Math.abs((b[i] ?? 0) - v)).toBeLessThan(0.05 * DEG);
        });
      }
    }
  });

  it('drifts one way into a pulse and the other way out of it', () => {
    for (let n = 1; n < 16; n++) {
      const axis = pulseAxis(n);
      const t0 = pulseTime(n);
      const rate = (t: number) => ((sample(t + 0.01)[axis] ?? 0) - (sample(t)[axis] ?? 0)) / 0.01;
      const before = rate(t0 - 1);
      const after = rate(t0 + PULSE + 1);
      expect(Math.sign(before)).toBe(-Math.sign(after));
      expect(Math.abs(before)).toBeGreaterThan(0.05 * DEG);
    }
  });
});

describe('thruster nozzles and puffs', () => {
  it('places the nozzle table on the modelled thruster cones', () => {
    for (let k = 0; k < 12; k++) {
      const part = PARTS.find((p) => p.id === `thruster-${String(k)}`);
      expect(part?.position).toEqual(NOZZLES[k]);
    }
  });

  it('fires the nozzle whose torque pushes the right way on pitch and yaw', () => {
    // A rear nozzle exhausts along -Z, pushing the craft along +Z: torque = r × (0, 0, 1).
    const torque = ([x, y]: readonly number[]) => [y ?? 0, -(x ?? 0)];
    for (const axis of [0, 1] as const) {
      for (const sign of [1, -1] as const) {
        const nozzle = NOZZLES[NOZZLE_FOR[axis][sign === 1 ? 'positive' : 'negative']];
        if (!nozzle) throw new Error('missing nozzle');
        expect(Math.sign(torque(nozzle)[axis] ?? 0)).toBe(sign);
      }
    }
    const all = [0, 1, 2].flatMap((a) => [
      NOZZLE_FOR[a as 0].positive,
      NOZZLE_FOR[a as 0].negative,
    ]);
    expect(new Set(all).size).toBe(6);
  });

  it('shapes each puff: up by 0.15 s, gone by 0.4 s', () => {
    expect(puffEnvelope(-0.1)).toBe(0);
    expect(puffEnvelope(0)).toBe(0);
    expect(puffEnvelope(0.15)).toBeCloseTo(1, 9);
    expect(puffEnvelope(0.4)).toBe(0);
    expect(puffEnvelope(2)).toBe(0);
    let peakAt = 0;
    let peak = 0;
    for (let a = 0; a <= 0.4; a += 0.001) {
      if (puffEnvelope(a) > peak) [peak, peakAt] = [puffEnvelope(a), a];
    }
    expect(peakAt).toBeCloseTo(0.15, 2);
  });

  it('lights only the opposing nozzle during a pulse, nothing otherwise', () => {
    for (let n = 1; n < 10; n++) {
      const t0 = pulseTime(n);
      const axis = pulseAxis(n);
      const drift =
        (voyagerPoseInto(createPose(), t0 - 0.5, false).attitude[axis] ?? 0) -
        (voyagerPoseInto(createPose(), t0 - 1, false).attitude[axis] ?? 0);
      const expected = NOZZLE_FOR[axis as 0][drift > 0 ? 'negative' : 'positive'];
      const pose = voyagerPoseInto(createPose(), t0 + 0.15, false);
      expect(pose.pulseCount).toBe(n);
      pose.puffs.forEach((v, k) => {
        expect(v, `nozzle ${String(k)}`).toBeCloseTo(k === expected ? 1 : 0, 6);
      });
      const quiet = voyagerPoseInto(createPose(), t0 + 1, false);
      for (const v of quiet.puffs) expect(v).toBe(0);
    }
  });

  it('shows no puff and no pulse under reduced motion', () => {
    const pose = voyagerPoseInto(createPose(), pulseTime(3) + 0.15, true);
    for (const v of pose.puffs) expect(v).toBe(0);
    expect(pose.pulseCount).toBe(-1);
  });
});
