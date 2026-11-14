import { describe, expect, it } from 'vitest';
import { STOPS } from '../../content/journey';
import { buildRoute } from '../../journey/route';
import {
  crossingGlow,
  deepSkyFade,
  heliopauseLayout,
  R_HELIO,
  rimGlow,
  shellsVisible,
} from './heliosphere';

const route = buildRoute(STOPS);
const closeZ = (id: string) =>
  -(route.closePoints[STOPS.findIndex((s) => s.id === id)] ?? NaN) * route.length;
const layout = heliopauseLayout(route);
const zEris = closeZ('eris');

describe('heliopauseLayout', () => {
  it('puts the heliopause crossing between Eris and the stop, the bow shock beyond the stop', () => {
    expect(layout.zStop).toBeCloseTo(closeZ('heliopause'));
    expect(layout.zCross).toBeLessThan(zEris);
    expect(layout.zCross).toBeGreaterThan(layout.zStop);
    expect(layout.zBow).toBeLessThan(layout.zStop);
    expect(layout.zBow).toBeGreaterThan(-route.length);
  });

  it('centres each shell beyond its nose, so it bulges toward the camera and the path meets its nose', () => {
    expect(layout.helioCentre).toEqual([0, 0, layout.zCross - layout.helioRadius]);
    expect(layout.bowCentre).toEqual([0, 0, layout.zBow - layout.bowRadius]);
    expect(layout.helioRadius).toBe(R_HELIO);
  });

  it('puts the bow shock’s limb inside the view from the heliopause stop', () => {
    // Half the vertical field of view is 25°; the limb should sit just beyond it, framing the card.
    const d = layout.zStop - layout.zBow;
    const limb = Math.asin(layout.bowRadius / (layout.bowRadius + d));
    expect(limb).toBeGreaterThan((25 * Math.PI) / 180);
    expect(limb).toBeLessThan((40 * Math.PI) / 180);
  });

  it('throws for a route without a heliopause stop', () => {
    expect(() => heliopauseLayout(buildRoute(STOPS.slice(0, 3)))).toThrow(/heliopause/);
  });
});

describe('rimGlow', () => {
  it('is nearly clear face-on and glows at glancing views', () => {
    expect(rimGlow(1)).toBeLessThan(0.1);
    expect(rimGlow(-1)).toBeCloseTo(rimGlow(1));
    expect(rimGlow(0.2)).toBeGreaterThan(rimGlow(0.7));
    expect(rimGlow(0)).toBeCloseTo(1);
  });
});

describe('crossingGlow', () => {
  it('rises from 0 well before the crossing, peaks at it and is gone by the stop', () => {
    expect(crossingGlow(zEris, layout)).toBe(0);
    expect(crossingGlow(layout.zCross + 200, layout)).toBe(0);
    expect(crossingGlow(layout.zCross, layout)).toBeCloseTo(1);
    expect(crossingGlow(layout.zCross - 20, layout)).toBeGreaterThan(0);
    expect(crossingGlow(layout.zStop, layout)).toBe(0);
    expect(crossingGlow(layout.zStop - 500, layout)).toBe(0);
  });
});

describe('deepSkyFade', () => {
  it('is 0 through the Solar System and 1 by the heliopause stop', () => {
    expect(deepSkyFade(0, layout)).toBe(0);
    expect(deepSkyFade(zEris, layout)).toBe(0);
    const mid = deepSkyFade((layout.zCross + layout.zStop) / 2, layout);
    expect(mid).toBeGreaterThan(0);
    expect(mid).toBeLessThan(1);
    expect(deepSkyFade(layout.zStop, layout)).toBe(1);
    expect(deepSkyFade(-route.length, layout)).toBe(1);
  });
});

describe('shellsVisible', () => {
  it('hides the shells until the camera nears the crossing', () => {
    expect(shellsVisible(zEris + 2000, layout)).toBe(false);
    expect(shellsVisible(layout.zCross + 100, layout)).toBe(true);
    expect(shellsVisible(-route.length, layout)).toBe(true);
  });
});
