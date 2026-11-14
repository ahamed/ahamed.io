import { describe, expect, it } from 'vitest';
import type { ChasePose } from './camera';
import { INTRO_MS, introProgress, introPoseInto, introStartPose } from './intro';
import type { Vec3 } from './route';

const earth: Vec3 = [4.6, 0, -4];
const chase = (): ChasePose => ({ position: [0, 2.2, 7], lookAt: [0, 0.6, -10] });
const distance = (a: Vec3, b: Vec3) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);

describe('intro sweep', () => {
  it('starts wide and high, well away from the chase camera', () => {
    const start = introStartPose(earth);
    expect(start.position[1]).toBeGreaterThan(8);
    expect(distance(start.position, chase().position)).toBeGreaterThan(15);
  });

  it('frames Earth and Voyager from the start pose', () => {
    const start = introStartPose(earth);
    const look = start.lookAt;
    expect(distance(look, earth)).toBeLessThan(distance(look, [0, 0, 0]) + 5);
  });

  it('is the start pose at t 0 and the chase pose at t 1', () => {
    const start = introStartPose(earth);
    const at0 = introPoseInto(chase(), start, 0);
    expect(at0.position).toEqual(start.position);
    expect(at0.lookAt).toEqual(start.lookAt);
    expect(introPoseInto(chase(), start, 1)).toEqual(chase());
  });

  it('eases in and out', () => {
    const start = introStartPose(earth);
    const total = distance(start.position, chase().position);
    const early = distance(introPoseInto(chase(), start, 0.05).position, start.position);
    const middle = distance(introPoseInto(chase(), start, 0.5).position, start.position);
    expect(early / total).toBeLessThan(0.01);
    expect(middle / total).toBeCloseTo(0.5);
  });

  it('turns elapsed time into sweep progress over about 3 seconds', () => {
    expect(INTRO_MS).toBe(3000);
    expect(introProgress(0)).toBe(0);
    expect(introProgress(INTRO_MS / 2)).toBe(0.5);
    expect(introProgress(INTRO_MS * 2)).toBe(1);
    expect(introProgress(-5)).toBe(0);
  });
});
