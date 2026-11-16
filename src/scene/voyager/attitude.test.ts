import { describe, expect, it } from 'vitest';
import {
  attitudeAnglesInto,
  createAttitude,
  quatAngle,
  stepAttitudeInto,
  TURN_END,
  TURN_START,
  type AttitudeInput,
  type Quat,
} from './attitude';
import { dishAxisInto, VOYAGER_ORIENTATION } from './orientation';

type Vec3 = [number, number, number];
const DEG = Math.PI / 180;

/** The dish axis for Euler XYZ (pitch, yaw, 0), as `dishAxisInto` computes it. */
function dishFor([pitch, yaw]: Vec3): Vec3 {
  const x = Math.sin(yaw);
  const z = Math.cos(yaw);
  return [x, -z * Math.sin(pitch), z * Math.cos(pitch)];
}

const unit = (v: Vec3): Vec3 => {
  const l = Math.hypot(...v);
  return [v[0] / l, v[1] / l, v[2] / l];
};

describe('attitudeAnglesInto', () => {
  it('gives back the cruise orientation for the cruise dish axis', () => {
    const angles: Vec3 = [0, 0, 0];
    attitudeAnglesInto(angles, dishAxisInto([0, 0, 0]));
    expect(angles[0]).toBeCloseTo(VOYAGER_ORIENTATION[0]);
    expect(angles[1]).toBeCloseTo(VOYAGER_ORIENTATION[1]);
    expect(angles[2]).toBe(0);
  });

  it('points the dish along any direction within half a degree, with no roll', () => {
    const angles: Vec3 = [0, 0, 0];
    for (const dir of [
      [1, 0, 0],
      [-1, 0.2, -0.3],
      [0.3, -0.4, -1],
      [0, 0, 1],
      [0.2, 0.9, 0.1],
    ] as Vec3[]) {
      const d = unit(dir);
      attitudeAnglesInto(angles, d);
      const got = dishFor(angles);
      const cos = got[0] * d[0] + got[1] * d[1] + got[2] * d[2];
      expect(Math.acos(Math.min(1, cos)) / DEG).toBeLessThan(0.5);
      expect(angles[2]).toBe(0);
    }
  });
});

describe('stepAttitudeInto', () => {
  const input = (): AttitudeInput => ({
    body: null,
    earth: [0, 0, 1],
    finale: 0,
    reduced: false,
  });

  it('holds the cruise orientation with no target', () => {
    const a = createAttitude();
    const cruise: Quat = [...a.quat];
    for (let i = 0; i < 60; i++) stepAttitudeInto(a, input(), 1 / 60);
    expect(quatAngle(a.quat, cruise)).toBeLessThan(1e-6);
  });

  it('turns smoothly to face a body, signalling the start and the end of the turn', () => {
    const a = createAttitude();
    const inp = input();
    inp.body = [1, 0, 0];
    let events = 0;
    let lastRate = 0;
    let prev: Quat = [...a.quat];
    for (let i = 0; i < 4 * 60; i++) {
      events |= stepAttitudeInto(a, inp, 1 / 60);
      const rate = quatAngle(a.quat, prev) * 60;
      // No jump in angular rate between frames.
      expect(Math.abs(rate - lastRate)).toBeLessThan(0.2);
      lastRate = rate;
      prev = [...a.quat];
    }
    expect(events & TURN_START).toBeTruthy();
    expect(events & TURN_END).toBeTruthy();
    const angles: Vec3 = [0, 0, 0];
    attitudeAnglesInto(angles, [1, 0, 0]);
    const facing = createAttitude();
    stepAttitudeInto(facing, { ...inp, reduced: true }, 0);
    expect(quatAngle(a.quat, facing.quat) / DEG).toBeLessThan(1);
  });

  it('tracks a body that moves round it exactly once turned', () => {
    const a = createAttitude();
    const inp = input();
    inp.body = [1, 0, 0];
    for (let i = 0; i < 4 * 60; i++) stepAttitudeInto(a, inp, 1 / 60);
    inp.body = [0, 0, -1];
    stepAttitudeInto(a, inp, 1 / 60);
    const exact = createAttitude();
    stepAttitudeInto(exact, { ...inp, reduced: true }, 0);
    expect(quatAngle(a.quat, exact.quat) / DEG).toBeLessThan(0.5);
  });

  it('faces Earth as the finale turn completes', () => {
    const a = createAttitude();
    const inp = input();
    inp.finale = 1;
    stepAttitudeInto(a, inp, 1 / 60);
    const exact = createAttitude();
    stepAttitudeInto(exact, { ...inp, finale: 0, body: inp.earth, reduced: true }, 0);
    expect(quatAngle(a.quat, exact.quat) / DEG).toBeLessThan(0.5);
  });

  it('snaps to the target under reduced motion, with no turn events', () => {
    const a = createAttitude();
    const inp = input();
    inp.body = [1, 0, 0];
    inp.reduced = true;
    const events = stepAttitudeInto(a, inp, 1 / 60);
    expect(events).toBe(0);
    expect(a.weight).toBe(1);
  });
});
