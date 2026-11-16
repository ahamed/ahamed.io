import { describe, expect, it } from 'vitest';
import { STOPS } from '../content/journey';
import {
  aimTowardInto,
  aimWeight,
  chasePoseInto,
  type ChasePose,
  orbitPoseInto,
  viewAreaInto,
} from './camera';
import { buildRoute, pointAt, type RouteBody, type Vec3 } from './route';

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

describe('orbitPoseInto', () => {
  const fovY = (50 * Math.PI) / 180;
  const body: RouteBody = {
    id: 'moon',
    body: 'moon',
    radius: 1.8,
    footprint: 1.8,
    position: [-4.14, 0, -100],
  };
  const R = 4.14;
  const out: ChasePose = { position: [0, 0, 0], lookAt: [0, 0, 0] };

  /** Tangent-plane coordinates of `q` seen from the pose (x right, y up). */
  function view(pose: ChasePose, q: Vec3): [number, number] {
    const f = sub(pose.lookAt, pose.position);
    norm(f);
    const r = cross(f, [0, 1, 0]);
    norm(r);
    const u = cross(r, f);
    const d = sub(q, pose.position);
    const depth = dot(d, f);
    return [dot(d, r) / depth, dot(d, u) / depth];
  }

  it('looks at the body from 35° above, behind the orbit', () => {
    orbitPoseInto(out, body, R, fovY, 16 / 9);
    expect(out.lookAt).toEqual(body.position);
    const [dx, dy, dz] = sub(out.position, body.position);
    expect(dz).toBeGreaterThan(0);
    expect(dx).toBeCloseTo(0);
    expect(Math.atan2(dy, dz) * (180 / Math.PI)).toBeCloseTo(35);
  });

  for (const aspect of [16 / 9, 9 / 16]) {
    it(`keeps the whole lap in the viewing area at aspect ${aspect.toFixed(2)}`, () => {
      orbitPoseInto(out, body, R, fovY, aspect);
      const halfY = Math.tan(fovY / 2);
      const halfX = halfY * aspect;
      for (let k = 0; k < 32; k++) {
        const a = (k / 32) * 2 * Math.PI;
        const [bx, by, bz] = body.position;
        const [x, y] = view(out, [bx + R * Math.cos(a), by, bz + R * Math.sin(a)]);
        expect(Math.abs(x)).toBeLessThan(halfX);
        expect(Math.abs(y)).toBeLessThan(halfY);
      }
    });
  }
});

function sub(a: Vec3, b: Vec3): Vec3 {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}
function dot(a: Vec3, b: Vec3): number {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}
function cross(a: Vec3, b: Vec3): Vec3 {
  return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
}
function norm(a: Vec3): void {
  const l = Math.hypot(...a);
  a[0] /= l;
  a[1] /= l;
  a[2] /= l;
}

describe('viewAreaInto', () => {
  const area = { aspect: 0, fovY: 0, offsetX: 0, offsetY: 0 };
  const fovY = (50 * Math.PI) / 180;

  it('centres the look-at in the space beside the docked dialog on wide screens', () => {
    viewAreaInto(area, { w: 1440, h: 900 }, { dock: 480, sheet: 0 }, fovY, 1);
    // setViewOffset draws the full image's centre at (w/2 − offsetX, h/2 − offsetY).
    expect(1440 / 2 - area.offsetX).toBeCloseTo(480 + (1440 - 480) / 2);
    expect(900 / 2 - area.offsetY).toBeCloseTo(450);
    expect(area.aspect).toBeCloseTo((1440 - 480) / 900);
    expect(area.fovY).toBeCloseTo(fovY);
  });

  it('centres it above the bottom sheet on narrow screens', () => {
    viewAreaInto(area, { w: 375, h: 800 }, { dock: 0, sheet: 300 }, fovY, 1);
    expect(375 / 2 - area.offsetX).toBeCloseTo(187.5);
    expect(800 / 2 - area.offsetY).toBeCloseTo(250);
    expect(area.aspect).toBeCloseTo(375 / 500);
    expect(Math.tan(area.fovY / 2)).toBeCloseTo(Math.tan(fovY / 2) * (500 / 800));
  });

  it('scales the shift with the capture weight and is the full view at 0', () => {
    viewAreaInto(area, { w: 1440, h: 900 }, { dock: 480, sheet: 0 }, fovY, 0.5);
    expect(area.offsetX).toBeCloseTo(-120);
    viewAreaInto(area, { w: 1440, h: 900 }, { dock: 480, sheet: 0 }, fovY, 0);
    expect(area.offsetX).toBe(0);
  });
});
