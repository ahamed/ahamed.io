import { describe, expect, it } from 'vitest';
import { STOPS } from '../content/journey';
import {
  BODY_INFO,
  buildRoute,
  END_SLACK,
  gapWeights,
  MIN_GAP_WEIGHT,
  PATH_CLEARANCE,
  pointAt,
  type Vec3,
} from './route';

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
        expect(d, `${a.id}/${b.id}`).toBeGreaterThan(a.footprint + b.footprint);
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

  it('keeps every footprint (Saturn’s rings included) clear of the flight path', () => {
    for (const body of route.bodies) {
      const clearance = Math.hypot(body.position[0], body.position[1]) - body.footprint;
      expect(clearance, body.id).toBeGreaterThanOrEqual(PATH_CLEARANCE);
    }
  });

  it('gives Saturn a footprint out to its rings and every other body its own radius', () => {
    for (const body of route.bodies) {
      if (body.body === 'saturn') expect(body.footprint).toBeGreaterThan(2 * body.radius);
      else expect(body.footprint, body.id).toBe(body.radius);
    }
  });

  it('keeps bodies without rings at 2.3 radii beside the route, as before footprints', () => {
    for (const body of route.bodies) {
      if (body.body === 'saturn') continue;
      expect(Math.abs(body.position[0]), body.id).toBeCloseTo(2.3 * body.radius, 9);
    }
  });

  it('puts the gas giants and their moons after Hygiea, moons alternating behind each planet', () => {
    const x = (id: string) => route.bodies.find((b) => b.id === id)?.position[0] ?? NaN;
    expect(x('jupiter')).toBeGreaterThan(0);
    expect(x('saturn')).toBeGreaterThan(0);
    expect([x('io'), x('europa'), x('ganymede'), x('callisto')].map(Math.sign)).toEqual([
      -1, 1, -1, 1,
    ]);
    expect([x('titan'), x('rhea'), x('iapetus'), x('enceladus')].map(Math.sign)).toEqual([
      -1, 1, -1, 1,
    ]);
  });

  it('sizes the gas-giant moons in their real order, never below the floor', () => {
    const r = (id: keyof typeof BODY_INFO) => BODY_INFO[id].radius;
    expect(r('jupiter')).toBe(16);
    expect(r('saturn')).toBe(13);
    expect(r('ganymede')).toBeGreaterThan(r('titan'));
    expect(r('titan')).toBeGreaterThan(r('callisto'));
    expect(r('callisto')).toBeGreaterThan(r('io'));
    expect(r('io')).toBeGreaterThan(r('europa'));
    expect(r('europa')).toBeGreaterThanOrEqual(r('rhea'));
    expect(r('rhea')).toBeGreaterThanOrEqual(r('iapetus'));
    expect(r('iapetus')).toBeGreaterThanOrEqual(r('enceladus'));
  });

  it('splits the Saturn to Pluto cruise into four even legs with the three comets', () => {
    const cp = (id: string) => route.closePoints[STOPS.findIndex((s) => s.id === id)] ?? NaN;
    const ids = ['enceladus', 'support-comet', 'recruiter-comet', 'upcoming-comet', 'pluto'];
    const legs = ids.slice(1).map((id, i) => cp(id) - cp(ids[i] ?? ''));
    const mean = legs.reduce((a, b) => a + b, 0) / legs.length;
    for (const leg of legs) expect(Math.abs(leg - mean) / mean).toBeLessThan(0.25);
  });

  it('keeps comets on the planet side and Charon opposite Pluto', () => {
    const x = (id: string) => route.bodies.find((b) => b.id === id)?.position[0] ?? NaN;
    for (const id of [
      'support-comet',
      'recruiter-comet',
      'upcoming-comet',
      'pluto',
      'arrokoth',
      'eris',
    ]) {
      expect(x(id), id).toBeGreaterThan(0);
    }
    expect(x('charon')).toBeLessThan(0);
  });

  it('ends with the heliopause after Eris, a log-compressed ≈25 AU gap away', () => {
    expect(route.bodies.at(-1)?.id).toBe('heliopause');
    expect(route.bodies.at(-2)?.id).toBe('eris');
    expect(BODY_INFO.heliopause.distanceKm).toBeGreaterThan(3.5e9);
    expect(BODY_INFO.heliopause.distanceKm).toBeLessThan(4e9);
    expect(route.closePoints.at(-1)).toBeCloseTo(1 - END_SLACK);
  });

  it('writes positions along the path into a provided vector', () => {
    const out: Vec3 = [0, 0, 0];
    pointAt(route, 0.5, out);
    expect(out[2]).toBeCloseTo(-0.5 * route.length);
  });
});
