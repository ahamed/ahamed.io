import { describe, expect, it } from 'vitest';
import { STOPS } from '../content/journey';
import { aimTowardInto, aimWeight, chasePoseInto, type ChasePose } from './camera';
import { buildRoute, pointAt, type Vec3 } from './route';

const route = buildRoute(STOPS);
const newPose = (): ChasePose => ({ position: [0, 0, 0], lookAt: [0, 0, 0] });

describe('chasePoseInto', () => {
  it('puts the camera behind and above Voyager', () => {
    const pose = newPose();
    const ship: Vec3 = [0, 0, 0];
    chasePoseInto(pose, route, 0.3);
    pointAt(route, 0.3, ship);
    expect(pose.position[1]).toBeGreaterThan(ship[1]); // above
    expect(pose.position[2]).toBeGreaterThan(ship[2]); // behind (travel is -Z)
    expect(pose.lookAt[2]).toBeLessThan(pose.position[2]); // looking forward
  });

  it('moves continuously with progress', () => {
    const a = newPose();
    const b = newPose();
    chasePoseInto(a, route, 0.5);
    chasePoseInto(b, route, 0.5001);
    const d = Math.hypot(
      a.position[0] - b.position[0],
      a.position[1] - b.position[1],
      a.position[2] - b.position[2],
    );
    // No jump: a 0.0001 progress step moves the camera about that share of the route length.
    expect(d).toBeLessThanOrEqual(0.0001 * route.length * 1.001);
  });
});

describe('aimTowardInto', () => {
  it('blends the look-at point toward a body by the given weight', () => {
    const out: Vec3 = [0, 0, 0];
    aimTowardInto(out, [0, 0, -10], [10, 0, -10], 0.5);
    expect(out).toEqual([5, 0, -10]);
  });

  it('leaves the aim unchanged at weight 0 and clamps the weight to [0, 1]', () => {
    const out: Vec3 = [0, 0, 0];
    aimTowardInto(out, [1, 2, 3], [9, 9, 9], 0);
    expect(out).toEqual([1, 2, 3]);
    aimTowardInto(out, [1, 2, 3], [9, 9, 9], 4);
    expect(out).toEqual([9, 9, 9]);
  });
});

describe('aimWeight', () => {
  it('aims harder in portrait and only when a body is near', () => {
    expect(aimWeight(0, 1.6)).toBe(0);
    expect(aimWeight(0.4, 0.5)).toBeGreaterThan(aimWeight(0.4, 1.6));
    expect(aimWeight(1, 0.5)).toBeLessThanOrEqual(1);
  });
});
