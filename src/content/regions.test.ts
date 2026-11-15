import { describe, expect, it } from 'vitest';
import { STOPS } from './journey';
import { REGIONS } from './regions';

describe('REGIONS', () => {
  it('groups the voyage into six sections in route order', () => {
    expect(REGIONS.map((r) => r.title)).toEqual([
      'Inner system',
      'Asteroid belt',
      'Jupiter',
      'Saturn',
      'Outer system',
      'Heliopause',
    ]);
  });

  it('holds every stop except Earth exactly once, in route order', () => {
    const ids = REGIONS.flatMap((r) => r.stops);
    expect(ids).toEqual(STOPS.slice(1).map((s) => s.id));
  });
});
