import { describe, expect, it } from 'vitest';
import { STOPS } from '../content/journey';
import {
  capturePoint,
  LAP_REST_MS,
  lapAngleAt,
  lapMs,
  lapPoseInto,
  lapRadius,
  readingMs,
  revealAt,
  TYPE_CPS,
} from './orbit';
import { buildRoute, PATH_CLEARANCE, type Vec3 } from './route';

const chars = (n: number) => 'x'.repeat(n);

describe('lapMs', () => {
  it('is the typing time at 60 characters a second plus 2.5 s of rest', () => {
    expect(TYPE_CPS).toBe(60);
    expect(LAP_REST_MS).toBe(2500);
    expect(lapMs(chars(300))).toBeCloseTo(7500);
  });
});

describe('revealAt', () => {
  it('reveals 60 characters per second of clock', () => {
    expect(revealAt(0, 300)).toBe(0);
    expect(revealAt(2000, 300)).toBe(120);
  });

  it('reaches the whole text exactly at the typing time and stays clamped', () => {
    expect(revealAt(4999, 300)).toBe(299);
    expect(revealAt(5000, 300)).toBe(300);
    expect(revealAt(9000, 300)).toBe(300);
    expect(revealAt(-50, 300)).toBe(0);
  });
});

describe('readingMs', () => {
  it('reads at 200 words a minute', () => {
    const text = Array.from({ length: 100 }, () => 'word').join(' ');
    expect(readingMs(text)).toBeCloseTo(30_000);
  });

  it('never holds for less than 4 seconds', () => {
    expect(readingMs('Two words')).toBe(4000);
  });
});

describe('lap geometry', () => {
  const route = buildRoute(STOPS);
  const out = { position: [0, 0, 0] as Vec3, heading: [0, 0, 0] as Vec3 };

  it('captures level with the body centre on the route', () => {
    route.bodies.forEach((body, i) => {
      const p = capturePoint(route, i);
      expect(p * route.length).toBeCloseTo(-body.position[2]);
      expect(p).toBeGreaterThan(route.closePoints[i] ?? 0);
    });
  });

  it('starts and ends the lap at the capture point heading along the route', () => {
    for (const body of route.bodies) {
      const R = lapRadius(body);
      for (const theta of [0, 2 * Math.PI]) {
        lapPoseInto(out, body, R, theta);
        expect(out.position[0]).toBeCloseTo(0);
        expect(out.position[1]).toBeCloseTo(0);
        expect(out.position[2]).toBeCloseTo(body.position[2]);
        expect(out.heading[0]).toBeCloseTo(0);
        expect(out.heading[2]).toBeCloseTo(-1);
      }
    }
  });

  it('keeps the lap at the lap radius from the body, in its horizontal plane', () => {
    const body = route.bodies[1];
    if (!body) throw new Error('no moon');
    const R = lapRadius(body);
    for (let k = 0; k < 16; k++) {
      lapPoseInto(out, body, R, (k / 16) * 2 * Math.PI);
      const dx = out.position[0] - body.position[0];
      const dz = out.position[2] - body.position[2];
      expect(Math.hypot(dx, dz)).toBeCloseTo(R);
      expect(out.position[1]).toBe(0);
      expect(Math.hypot(...out.heading)).toBeCloseTo(1);
    }
  });

  it('clears every body by the path clearance, the orbited one included', () => {
    route.bodies.forEach((body, i) => {
      const R = lapRadius(body);
      expect(R - body.footprint).toBeGreaterThanOrEqual(PATH_CLEARANCE);
      route.bodies.forEach((other, j) => {
        if (i === j) return;
        const d = Math.hypot(
          other.position[0] - body.position[0],
          other.position[2] - body.position[2],
        );
        expect(Math.abs(d - R), `${body.id} lap vs ${other.id}`).toBeGreaterThanOrEqual(
          other.footprint + PATH_CLEARANCE,
        );
      });
    });
  });
});

describe('lapAngleAt', () => {
  const T = 7.5;
  const TAU = 2 * Math.PI;
  const mean = TAU / T;

  it('runs from 0 to a full turn', () => {
    expect(lapAngleAt(0, T, 0.3, mean)).toBe(0);
    expect(lapAngleAt(T, T, 0.3, mean)).toBeCloseTo(TAU);
    expect(lapAngleAt(T + 3, T, 0.3, mean)).toBeCloseTo(TAU);
  });

  it('matches the entry and exit rates at its ends', () => {
    const h = 1e-4;
    expect(lapAngleAt(h, T, 0.3, 1.1) / h).toBeCloseTo(0.3, 2);
    expect((TAU - lapAngleAt(T - h, T, 0.3, 1.1)) / h).toBeCloseTo(1.1, 2);
  });

  it('only ever moves forward, smoothly, at 60 frames a second', () => {
    for (const [entry, exit] of [
      [0, mean],
      [mean, mean],
      [5, 5],
    ] as const) {
      let prev = 0;
      let prevStep = NaN;
      for (let f = 1; f <= T * 60; f++) {
        const theta = lapAngleAt(f / 60, T, entry, exit);
        const step = theta - prev;
        expect(step).toBeGreaterThanOrEqual(0);
        if (!Number.isNaN(prevStep)) expect(Math.abs(step - prevStep)).toBeLessThan(0.01);
        prev = theta;
        prevStep = step;
      }
    }
  });
});
