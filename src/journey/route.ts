import type { BodyId, Stop } from '../content/schema';

export type Vec3 = [number, number, number];

/** Exaggerated render radii and real mean distance from the previous stop (km). */
export const BODY_INFO: Record<BodyId, { radius: number; distanceKm: number }> = {
  earth: { radius: 6, distanceKm: 0 },
  moon: { radius: 1.8, distanceKm: 384_400 },
};

/** Progress kept after the last stop so it can be passed. */
export const END_SLACK = 0.2;
/** World units per unit of progress (travel is toward -Z). */
const ROUTE_LENGTH = 1000;

export interface RouteBody {
  id: string;
  body: BodyId;
  radius: number;
  position: Vec3;
}

export interface Route {
  length: number;
  closePoints: number[];
  bodies: RouteBody[];
}

/** Log-compressed spacing: big real gaps grow slowly so the whole voyage stays scrollable. */
const gapWeight = (km: number): number => Math.log1p(km / 1000);

export function buildRoute(stops: readonly Stop[]): Route {
  const weights = stops.map((s, i) => (i === 0 ? 0 : gapWeight(BODY_INFO[s.body].distanceKm)));
  const total = weights.reduce((a, b) => a + b, 0);
  let cumulative = 0;
  const closePoints = weights.map((w) => {
    cumulative += w;
    return total === 0 ? 0 : (cumulative / total) * (1 - END_SLACK);
  });

  const bodies = stops.map((stop, i): RouteBody => {
    const { radius } = BODY_INFO[stop.body];
    const cp = closePoints[i] ?? 0;
    // Beside and slightly ahead of the close point so it fills the chase view there.
    return {
      id: stop.id,
      body: stop.body,
      radius,
      position: [radius * 2.3, 0, -(cp * ROUTE_LENGTH) - radius * 2],
    };
  });

  return { length: ROUTE_LENGTH, closePoints, bodies };
}

/** Voyager's position at progress `p`, written into `out` (no allocation). */
export function pointAt(route: Route, p: number, out: Vec3): Vec3 {
  out[0] = 0;
  out[1] = 0;
  out[2] = -p * route.length;
  return out;
}
