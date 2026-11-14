/** The voyage's two rock fields (no three.js imports), placed along a built route. */
import type { Route } from '../../journey/route';
import { beltSpan, spanAround, type BeltOptions } from './belt';

/** The main asteroid belt, around Ceres to Hygiea. */
export const asteroidBelt = (route: Route): BeltOptions => ({
  count: 2500,
  seed: 1801,
  ...beltSpan(route),
  corridor: 16,
  outer: 140,
  thickness: 30,
});

/** The Kuiper belt, around Pluto to Eris: icy, wider and sparser than the asteroid belt. */
export const kuiperBelt = (route: Route): BeltOptions => ({
  count: 1800,
  seed: 4703,
  ...spanAround(route, 'pluto', 'eris'),
  corridor: 16,
  outer: 220,
  thickness: 45,
});

/** Icy blue-grey for Kuiper belt rocks. */
export const KUIPER_COLOR = '#9fb0c2';
