import type { BodyId, Stop } from '../content/schema';

export type Vec3 = [number, number, number];

interface BodyInfo {
  /** Exaggerated render radius (world units). */
  radius: number;
  /** Representative real distance from the previous stop's body (km); a visual input only. */
  distanceKm: number;
  /** The planet a moon belongs to; moons sit on alternating sides behind it. */
  parent?: BodyId;
  /** Radius the body occupies for layout (a ringed planet's ring edge); defaults to `radius`. */
  footprint?: number;
}

/** Real mean radius of Ganymede (km), the reference for the gas-giant moon sizes. */
const GANYMEDE_KM = 2634.1;
/** Render radius of the largest moon; the others scale by real radius from it. */
const LARGEST_MOON = 2.4;
/**
 * Smallest render radius for a gas-giant moon, so each dialog still opens when parked at its
 * close point (checked for every stop in sizes.test.ts).
 */
export const MOON_FLOOR = 1;
const moonRadius = (km: number) => Math.max(MOON_FLOOR, (LARGEST_MOON * km) / GANYMEDE_KM);

/** A quarter of the Saturn→Pluto cruise (km): the gap before each comet and before Pluto. */
const CRUISE_LEG_KM = 1_100_000_000;

/** Saturn's outer A-ring edge, in Saturn radii (136,775 km / 60,268 km). */
export const RING_OUTER = 2.27;
/** Saturn's inner C-ring edge, in Saturn radii (74,658 km / 60,268 km). */
export const RING_INNER = 1.24;
const SATURN_RADIUS = 13;

/**
 * Smallest gap (world units) between any body’s footprint and the flight path, so neither
 * Voyager nor the chase camera (2.2 up, 7 back) ever passes through a body or ring.
 */
export const PATH_CLEARANCE = 1;

/**
 * Radii are exaggerated, and the small rocks most of all: the chase camera sits about 9 units
 * behind Voyager, so a rock must be about 1 unit across or more to open its dialog when parked
 * at its close point. The rocks keep their real order of size.
 */
export const BODY_INFO: Record<BodyId, BodyInfo> = {
  earth: { radius: 6, distanceKm: 0 },
  moon: { radius: 1.8, distanceKm: 384_400 },
  mars: { radius: 3.4, distanceKm: 225_000_000 }, // mean Earth–Mars distance
  phobos: { radius: 1.1, distanceKm: 9_376, parent: 'mars' }, // orbital radius
  deimos: { radius: 0.95, distanceKm: 14_084, parent: 'mars' }, // beyond Phobos's orbit
  ceres: { radius: 1.5, distanceKm: 187_000_000 }, // ≈1.25 AU from Mars
  vesta: { radius: 1.25, distanceKm: 61_000_000 }, // semi-major axis difference
  pallas: { radius: 1.2, distanceKm: 61_000_000 },
  hygiea: { radius: 1.05, distanceKm: 55_000_000 },
  jupiter: { radius: 16, distanceKm: 310_000_000 }, // ≈2.1 AU beyond Hygiea
  io: { radius: moonRadius(1821.6), distanceKm: 421_700, parent: 'jupiter' }, // orbital radii
  europa: { radius: moonRadius(1560.8), distanceKm: 671_000, parent: 'jupiter' },
  ganymede: { radius: moonRadius(2634.1), distanceKm: 1_070_400, parent: 'jupiter' },
  callisto: { radius: moonRadius(2410.3), distanceKm: 1_882_700, parent: 'jupiter' },
  saturn: {
    radius: SATURN_RADIUS,
    distanceKm: 650_000_000, // ≈4.3 AU beyond Jupiter
    footprint: SATURN_RADIUS * RING_OUTER,
  },
  titan: { radius: moonRadius(2574.7), distanceKm: 1_221_870, parent: 'saturn' },
  rhea: { radius: moonRadius(763.8), distanceKm: 527_108, parent: 'saturn' },
  iapetus: { radius: moonRadius(734.5), distanceKm: 3_560_820, parent: 'saturn' },
  enceladus: { radius: moonRadius(252.1), distanceKm: 237_948, parent: 'saturn' },
  // The three comets and Pluto split the ≈4.4×10⁹ km Saturn→Pluto cruise into four equal legs.
  'support-comet': { radius: 1, distanceKm: CRUISE_LEG_KM },
  'recruiter-comet': { radius: 1, distanceKm: CRUISE_LEG_KM },
  'upcoming-comet': { radius: 1, distanceKm: CRUISE_LEG_KM },
  pluto: { radius: 2.6, distanceKm: CRUISE_LEG_KM },
  charon: { radius: 1.6, distanceKm: 19_591, parent: 'pluto' }, // orbital radius
  arrokoth: { radius: 1, distanceKm: 750_000_000 }, // ≈5 AU beyond Pluto
  eris: { radius: 2.4, distanceKm: 3_600_000_000 }, // ≈24 AU further out
  // Voyager 1 crossed at ≈121 AU. Nothing is drawn here: the radius is an invisible anchor
  // that opens the dialog like any body (the shells are drawn by Heliopause).
  heliopause: { radius: 1.5, distanceKm: 3_700_000_000 },
};

/** Progress kept after the last stop so it can be passed. */
export const END_SLACK = 0.2;
/** World units of route per gap between stops (travel is toward -Z). */
const UNITS_PER_STOP = 400;
/**
 * Smallest spacing weight between neighbouring stops, so close moons still get their own
 * dialog and snap point (Earth→Moon is ≈5.95 for comparison).
 */
export const MIN_GAP_WEIGHT = 3.5;

export interface RouteBody {
  id: string;
  body: BodyId;
  radius: number;
  /** Layout radius: the ring edge for a ringed planet, otherwise `radius`. */
  footprint: number;
  position: Vec3;
}

export interface Route {
  length: number;
  closePoints: number[];
  bodies: RouteBody[];
}

/**
 * Spacing weight before each stop (0 for the first): log-compressed real distance, so big gaps
 * grow slowly and the whole voyage stays scrollable, floored at MIN_GAP_WEIGHT.
 */
export function gapWeights(stops: readonly Stop[]): number[] {
  return stops.map((s, i) =>
    i === 0 ? 0 : Math.max(MIN_GAP_WEIGHT, Math.log1p(BODY_INFO[s.body].distanceKm / 1000)),
  );
}

export function buildRoute(stops: readonly Stop[]): Route {
  const length = UNITS_PER_STOP * Math.max(1, stops.length - 1);
  const weights = gapWeights(stops);
  const total = weights.reduce((a, b) => a + b, 0);
  let cumulative = 0;
  const closePoints = weights.map((w) => {
    cumulative += w;
    return total === 0 ? 0 : (cumulative / total) * (1 - END_SLACK);
  });

  const moonsSeen = new Map<BodyId, number>();
  const bodies = stops.map((stop, i): RouteBody => {
    const { radius, parent } = BODY_INFO[stop.body];
    const footprint = BODY_INFO[stop.body].footprint ?? radius;
    const cp = closePoints[i] ?? 0;
    // Planets sit on +X; a planet's moons alternate, starting on the opposite side.
    let side = 1;
    if (parent) {
      const n = moonsSeen.get(parent) ?? 0;
      moonsSeen.set(parent, n + 1);
      side = n % 2 === 0 ? -1 : 1;
    }
    // Beside and slightly ahead of the close point so it fills the chase view there. The
    // footprint (rings) keeps the gap to the path; without rings this is 2.3 radii.
    return {
      id: stop.id,
      body: stop.body,
      radius,
      footprint,
      position: [side * (footprint + 1.3 * radius), 0, -(cp * length) - radius * 2],
    };
  });

  return { length, closePoints, bodies };
}

/** Voyager's position at progress `p`, written into `out` (no allocation). */
export function pointAt(route: Route, p: number, out: Vec3): Vec3 {
  out[0] = 0;
  out[1] = 0;
  out[2] = -p * route.length;
  return out;
}
