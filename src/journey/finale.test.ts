import { describe, expect, it } from 'vitest';
import type { ChasePose } from './camera';
import { finalePoseInto, finaleReveal, finaleTurn, TURN_END, TURN_START } from './finale';
import type { Vec3 } from './route';

const HELIOPAUSE_CP = 0.8;

describe('finale phases', () => {
  it('are 0 at and around the heliopause stop', () => {
    for (const p of [0, 0.5, HELIOPAUSE_CP, 0.84, TURN_START]) {
      expect(finaleTurn(p)).toBe(0);
      expect(finaleReveal(p)).toBe(0);
    }
  });

  it('turn fully by TURN_END, and reveal only after the turn is done', () => {
    expect(finaleTurn(TURN_END)).toBe(1);
    expect(finaleReveal(TURN_END)).toBe(0);
    expect(finaleReveal(1)).toBe(1);
  });

  it('never decrease as progress grows', () => {
    let turn = 0;
    let reveal = 0;
    for (let p = 0.8; p <= 1; p += 0.001) {
      expect(finaleTurn(p)).toBeGreaterThanOrEqual(turn);
      expect(finaleReveal(p)).toBeGreaterThanOrEqual(reveal);
      turn = finaleTurn(p);
      reveal = finaleReveal(p);
    }
  });
});

describe('finalePoseInto', () => {
  const ship: Vec3 = [0, 0, -10_000];
  const earth: Vec3 = [3, 0, -2];
  const chase = (): ChasePose => ({
    position: [0, 2.2, -10_000 + 7],
    lookAt: [0, 0.6, -10_010],
  });
  const offset = (pose: ChasePose): Vec3 => [
    pose.position[0] - ship[0],
    pose.position[1] - ship[1],
    pose.position[2] - ship[2],
  ];
  const unit = (v: Vec3): Vec3 => {
    const l = Math.hypot(...v);
    return [v[0] / l, v[1] / l, v[2] / l];
  };
  const angleDeg = (a: Vec3, b: Vec3): number => {
    const [ua, ub] = [unit(a), unit(b)];
    return (Math.acos(ua[0] * ub[0] + ua[1] * ub[1] + ua[2] * ub[2]) * 180) / Math.PI;
  };
  const view = (pose: ChasePose): Vec3 => [
    pose.lookAt[0] - pose.position[0],
    pose.lookAt[1] - pose.position[1],
    pose.lookAt[2] - pose.position[2],
  ];

  it('is the chase pose at turn 0', () => {
    const pose = chase();
    const out = finalePoseInto(pose, ship, 0, earth);
    expect(out).toBe(pose);
    expect(out).toEqual(chase());
  });

  it('puts the camera beside Voyager halfway through the turn', () => {
    const [x, , z] = offset(finalePoseInto(chase(), ship, 0.5, earth));
    expect(Math.abs(x)).toBeGreaterThan(4);
    expect(Math.abs(z)).toBeLessThan(1);
  });

  it('ends in front of Voyager, facing back toward Earth with Voyager in view', () => {
    const pose = finalePoseInto(chase(), ship, 1, earth);
    expect(offset(pose)[2]).toBeLessThan(-5);
    const toEarth: Vec3 = [
      earth[0] - pose.position[0],
      earth[1] - pose.position[1],
      earth[2] - pose.position[2],
    ];
    const toShip: Vec3 = [
      ship[0] - pose.position[0],
      ship[1] - pose.position[1],
      ship[2] - pose.position[2],
    ];
    expect(angleDeg(view(pose), toEarth)).toBeLessThan(15);
    expect(angleDeg(view(pose), toShip)).toBeLessThan(25);
  });
});
