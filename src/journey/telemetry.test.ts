import { describe, expect, it } from 'vitest';
import { STOPS } from '../content/journey';
import { buildRoute } from './route';
import {
  AU_PER_YEAR,
  emptyTelemetry,
  formatDate,
  HELIOPAUSE_TIME,
  TELEMETRY,
  telemetryAt,
} from './telemetry';

const route = buildRoute(STOPS);
const bodies = STOPS.map((s) => s.body);
const NOW = Date.UTC(2026, 10, 15);
const cp = (id: string) => route.closePoints[STOPS.findIndex((s) => s.id === id)] ?? NaN;
const at = (p: number) => telemetryAt(emptyTelemetry(), p, route.closePoints, bodies, NOW);

describe('TELEMETRY', () => {
  it('has a waypoint for every stop, in time order along the route', () => {
    let previous = -Infinity;
    for (const body of bodies) {
      const time = Date.parse(TELEMETRY[body].date);
      expect(time, body).toBeGreaterThanOrEqual(previous);
      previous = time;
    }
  });

  it('marks only the real Voyager 1 events as verified', () => {
    const verified = Object.entries(TELEMETRY)
      .filter(([, w]) => w.verified)
      .map(([id]) => id);
    expect(verified.sort()).toEqual(['earth', 'heliopause', 'jupiter', 'moon', 'saturn']);
  });
});

describe('telemetryAt', () => {
  it('reads launch day at about 1 AU at Earth', () => {
    const t = at(0);
    expect(formatDate(t.time)).toBe('05 Sep 1977');
    expect(t.au).toBeCloseTo(1, 0);
  });

  it('reads March 1979 at about 5.2 AU at Jupiter', () => {
    const t = at(cp('jupiter'));
    expect(formatDate(t.time)).toBe('05 Mar 1979');
    expect(t.au).toBeCloseTo(5.2);
  });

  it('reads 25 Aug 2012 at about 121.6 AU at the heliopause', () => {
    const t = at(cp('heliopause'));
    expect(formatDate(t.time)).toBe('25 Aug 2012');
    expect(t.au).toBeCloseTo(121.6);
    expect(HELIOPAUSE_TIME).toBe(t.time);
  });

  it('reaches today at the end of the route, still moving outward', () => {
    const t = at(1);
    expect(t.time).toBe(NOW);
    const years = (NOW - HELIOPAUSE_TIME) / (365.25 * 86_400_000);
    expect(t.au).toBeCloseTo(121.6 + AU_PER_YEAR * years);
  });

  it('interpolates between stops', () => {
    const a = at(cp('saturn'));
    const b = at(cp('titan'));
    const mid = at((cp('saturn') + cp('titan')) / 2);
    expect(mid.time).toBeGreaterThanOrEqual(a.time);
    expect(mid.time).toBeLessThanOrEqual(b.time);
    const c = at(cp('eris'));
    const d = at(cp('heliopause'));
    const between = at((cp('eris') + cp('heliopause')) / 2);
    expect(between.au).toBeCloseTo((c.au + d.au) / 2);
  });

  it('writes into the given object without allocating', () => {
    const out = emptyTelemetry();
    expect(telemetryAt(out, 0.5, route.closePoints, bodies, NOW)).toBe(out);
  });
});
