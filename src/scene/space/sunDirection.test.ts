import { describe, expect, it } from 'vitest';
import { STOPS } from '../../content/journey';
import { aimTowardInto, chasePoseInto, type ChasePose } from '../../journey/camera';
import { buildRoute, type Vec3 } from '../../journey/route';
import { SUN_DIRECTION, sunPositionInto } from './sunDirection';

const length = (v: readonly number[]) => Math.hypot(...v);

describe('SUN_DIRECTION', () => {
  it('is a unit vector', () => {
    expect(length(SUN_DIRECTION)).toBeCloseTo(1, 12);
  });

  it('points along the original key light (-40, 18, 30)', () => {
    const k = length([-40, 18, 30]);
    expect(SUN_DIRECTION[0]).toBeCloseTo(-40 / k, 12);
    expect(SUN_DIRECTION[1]).toBeCloseTo(18 / k, 12);
    expect(SUN_DIRECTION[2]).toBeCloseTo(30 / k, 12);
  });
});

describe('sunPositionInto', () => {
  it('writes origin + direction × distance into out and returns it', () => {
    const out: Vec3 = [0, 0, 0];
    const result = sunPositionInto(out, [1, 2, -300], 100);
    expect(result).toBe(out);
    expect(out[0]).toBeCloseTo(1 + SUN_DIRECTION[0] * 100, 9);
    expect(out[1]).toBeCloseTo(2 + SUN_DIRECTION[1] * 100, 9);
    expect(out[2]).toBeCloseTo(-300 + SUN_DIRECTION[2] * 100, 9);
  });
});

describe('the Sun in the chase view', () => {
  const route = buildRoute(STOPS);
  const pose: ChasePose = { position: [0, 0, 0], lookAt: [0, 0, 0] };
  const aim: Vec3 = [0, 0, 0];

  it.each([0, 0.5, 1])(
    'is behind the camera at progress 0, even when it turns fully toward Earth (weight %d)',
    (weight) => {
      chasePoseInto(pose, route, 0);
      const earth = route.bodies[0]?.position ?? [0, 0, 0];
      aimTowardInto(aim, pose.lookAt, earth, weight);
      const forward = [
        aim[0] - pose.position[0],
        aim[1] - pose.position[1],
        aim[2] - pose.position[2],
      ] as const;
      const dot =
        forward[0] * SUN_DIRECTION[0] +
        forward[1] * SUN_DIRECTION[1] +
        forward[2] * SUN_DIRECTION[2];
      expect(dot).toBeLessThan(0);
    },
  );
});
