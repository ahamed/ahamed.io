import { describe, expect, it } from 'vitest';
import { createPose, voyagerPoseInto, type VoyagerPose } from './motion';

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
      for (const a of pose.attitude) expect(Math.abs(a)).toBeLessThanOrEqual(0.5 * DEG);
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
