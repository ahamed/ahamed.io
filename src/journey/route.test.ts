import { describe, expect, it } from 'vitest';
import { STOPS } from '../content/journey';
import { buildRoute, END_SLACK, gapWeights, MIN_GAP_WEIGHT, pointAt, type Vec3 } from './route';

describe('buildRoute', () => {
  const route = buildRoute(STOPS);

  it('starts at Earth (progress 0) and puts the last stop before the end slack', () => {
    expect(route.closePoints[0]).toBe(0);
    expect(route.closePoints.at(-1)).toBeCloseTo(1 - END_SLACK, 12);
  });

  it('never spaces two stops closer than the minimum gap weight', () => {
    const weights = gapWeights(STOPS).slice(1);
    for (const w of weights) expect(w).toBeGreaterThanOrEqual(MIN_GAP_WEIGHT);
    // Phobos and Deimos are only ~10,000 km apart, so they rely on the floor.
    const byId = (id: string) => STOPS.findIndex((s) => s.id === id);
    expect(weights[byId('phobos') - 1]).toBe(MIN_GAP_WEIGHT);
    expect(weights[byId('deimos') - 1]).toBe(MIN_GAP_WEIGHT);
  });

  it('gives long cruises (to Mars, into the belt) more room than hops between moons', () => {
    const cp = (id: string) => route.closePoints[STOPS.findIndex((s) => s.id === id)] ?? NaN;
    expect(cp('mars') - cp('moon')).toBeGreaterThan(cp('phobos') - cp('mars'));
    expect(cp('ceres') - cp('deimos')).toBeGreaterThan(cp('deimos') - cp('phobos'));
  });

  it('places moons on alternating sides of the route, planets on +X', () => {
    const x = (id: string) => route.bodies.find((b) => b.id === id)?.position[0] ?? NaN;
    expect(x('mars')).toBeGreaterThan(0);
    expect(x('phobos')).toBeLessThan(0);
    expect(x('deimos')).toBeGreaterThan(0);
    for (const id of ['ceres', 'vesta', 'pallas', 'hygiea']) expect(x(id)).toBeGreaterThan(0);
  });

  it('never lets two bodies intersect', () => {
    const { bodies } = route;
    for (let i = 0; i < bodies.length; i++) {
      for (let j = i + 1; j < bodies.length; j++) {
        const a = bodies[i];
        const b = bodies[j];
        if (!a || !b) continue;
        const d = Math.hypot(
          a.position[0] - b.position[0],
          a.position[1] - b.position[1],
          a.position[2] - b.position[2],
        );
        expect(d, `${a.id}/${b.id}`).toBeGreaterThan(a.radius + b.radius);
      }
    }
  });

  it('lengthens the route as stops are added', () => {
    expect(buildRoute(STOPS.slice(0, 2)).length).toBeLessThan(route.length);
  });

  it('has strictly increasing close points', () => {
    for (let i = 1; i < route.closePoints.length; i++) {
      expect(route.closePoints[i]).toBeGreaterThan(route.closePoints[i - 1] ?? -1);
    }
  });

  it('places bodies along the travel direction in stop order', () => {
    expect(route.bodies.map((b) => b.id)).toEqual(STOPS.map((s) => s.id));
    // travel is toward -Z
    for (let i = 1; i < route.bodies.length; i++) {
      expect(route.bodies[i]?.position[2]).toBeLessThan(route.bodies[i - 1]?.position[2] ?? 0);
    }
  });

  it('keeps every body off the flight line so Voyager passes beside it', () => {
    for (const body of route.bodies) {
      expect(Math.hypot(body.position[0], body.position[1])).toBeGreaterThan(body.radius);
    }
  });

  it('writes positions along the path into a provided vector', () => {
    const out: Vec3 = [0, 0, 0];
    pointAt(route, 0.5, out);
    expect(out[2]).toBeCloseTo(-0.5 * route.length);
  });
});
