import { describe, expect, it } from 'vitest';
import type { Vec3 } from '../../journey/route';
import {
  CASSINI_DIVISION,
  planetShadowsRing,
  RING_SHADOW_STRENGTH,
  ringCoord,
  ringShadowOnPlanet,
  type Ring,
} from './ringShadow';

const norm = (v: Vec3): Vec3 => {
  const l = Math.hypot(...v);
  return [v[0] / l, v[1] / l, v[2] / l];
};

/** Saturn of radius 1 at the origin, rings flat in the XZ plane. */
const ring: Ring = { centre: [0, 0, 0], normal: [0, 1, 0], inner: 1.24, outer: 2.27 };
/** A dense ring everywhere except the Cassini Division. */
const alphaAt = (s: number) => {
  const r = ring.inner + s * (ring.outer - ring.inner);
  return r >= CASSINI_DIVISION[0] && r <= CASSINI_DIVISION[1] ? 0.05 : 0.9;
};

describe('ringCoord', () => {
  it('runs from 0 at the inner edge to 1 at the outer edge', () => {
    expect(ringCoord(1.24, 1.24, 2.27)).toBe(0);
    expect(ringCoord(2.27, 1.24, 2.27)).toBe(1);
    expect(ringCoord(1.755, 1.24, 2.27)).toBeCloseTo(0.5, 9);
  });
});

describe('planetShadowsRing', () => {
  const sun: Vec3 = [1, 0, 0];

  it('shadows a ring point behind the planet as seen from the Sun', () => {
    expect(planetShadowsRing([-1.8, 0, 0], [0, 0, 0], 1, sun)).toBe(true);
  });

  it('leaves a ring point in direct sunlight lit', () => {
    expect(planetShadowsRing([1.8, 0, 0], [0, 0, 0], 1, sun)).toBe(false);
    expect(planetShadowsRing([0, 0, 1.8], [0, 0, 0], 1, sun)).toBe(false);
  });
});

describe('ringShadowOnPlanet', () => {
  const northern: Vec3 = [0, 0.8, 0.6];
  /** Sunlight from `northern` that crosses the ring plane at radius `r` (along +Z). */
  const sunThrough = (r: number) => norm([0, -0.8, r - 0.6]);

  it('darkens a point whose sunlight passes through the dense rings', () => {
    const shade = ringShadowOnPlanet(northern, ring, sunThrough(1.4), alphaAt);
    expect(shade).toBeCloseTo(1 - RING_SHADOW_STRENGTH * 0.9, 9);
  });

  it('barely darkens a point whose sunlight passes through the Cassini Division', () => {
    const shade = ringShadowOnPlanet(northern, ring, sunThrough(1.99), alphaAt);
    expect(shade).toBeGreaterThan(0.9);
  });

  it('leaves a point lit when its sunlight crosses the plane beyond the rings', () => {
    expect(ringShadowOnPlanet(northern, ring, sunThrough(2.5), alphaAt)).toBe(1);
  });

  it('ignores the rings when the sunlight never reaches the ring plane', () => {
    const southern: Vec3 = [0, -0.8, 0.6];
    expect(ringShadowOnPlanet(southern, ring, norm([0, -1, 1]), alphaAt)).toBe(1);
  });
});
