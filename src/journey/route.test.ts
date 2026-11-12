import { describe, expect, it } from 'vitest';
import { STOPS } from '../content/journey';
import { buildRoute, pointAt, type Vec3 } from './route';

describe('buildRoute', () => {
  const route = buildRoute(STOPS);

  it('places Earth at progress 0 and the Moon at 0.8', () => {
    expect(route.closePoints).toEqual([0, 0.8]);
  });

  it('has strictly increasing close points', () => {
    for (let i = 1; i < route.closePoints.length; i++) {
      expect(route.closePoints[i]).toBeGreaterThan(route.closePoints[i - 1] ?? -1);
    }
  });

  it('places bodies along the travel direction in stop order', () => {
    const [earth, moon] = route.bodies;
    expect(earth?.id).toBe('earth');
    expect(moon?.id).toBe('moon');
    // travel is toward -Z
    expect(moon?.position[2]).toBeLessThan(earth?.position[2] ?? 0);
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
