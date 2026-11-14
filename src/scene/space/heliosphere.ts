import type { Route, Vec3 } from '../../journey/route';

/**
 * The heliopause and the bow shock beyond it (no three.js imports). Each is a spherical cap
 * bulging toward the approaching camera, centred beyond its nose on the path, so the flight
 * path meets each at its nose: the heliopause just before the heliopause stop, the bow shock
 * just after it. Seen from outside, a cap's limb is edge-on, so its Fresnel rim reads as a
 * glowing ring around the view. (From inside a sphere no surface is ever seen edge-on.)
 */

/** Heliopause shell radius (world units): its ring widens past the view as Voyager nears. */
export const R_HELIO = 600;
/** Bow-shock radius: its limb sits about 33° off the view centre from the heliopause stop. */
export const R_BOW = 300;
/** The path meets the heliopause this far (units) before the stop's close point. */
const CROSS_BEFORE_STOP = 60;
/** …and the bow shock this far beyond it. */
const BOW_AFTER_STOP = 240;
/** The crossing glow starts rising this far before the crossing. */
const GLOW_LEAD = 80;
/** The deep sky starts fading in this far before the crossing. */
const FADE_LEAD = 100;
/** The shells are drawn once the camera is this close to the crossing. */
const SHELL_DRAW_DISTANCE = 1500;
/** Face-on brightness: nearly clear. */
const RIM_FLOOR = 0.03;
/** Fresnel exponent: higher keeps the glow nearer the rim. */
export const RIM_POWER = 3;

export interface HeliopauseLayout {
  /** Close-point z of the heliopause stop. */
  zStop: number;
  /** Where the path crosses the heliopause. */
  zCross: number;
  /** Where the path crosses the bow shock. */
  zBow: number;
  helioCentre: Vec3;
  bowCentre: Vec3;
  helioRadius: number;
  bowRadius: number;
}

type RouteLike = Pick<Route, 'length' | 'closePoints' | 'bodies'>;

export function heliopauseLayout(route: RouteLike): HeliopauseLayout {
  const i = route.bodies.findIndex((b) => b.body === 'heliopause');
  if (i < 0) throw new Error('route has no heliopause stop');
  const zStop = -(route.closePoints[i] ?? 0) * route.length;
  const zCross = zStop + CROSS_BEFORE_STOP;
  const zBow = zStop - BOW_AFTER_STOP;
  return {
    zStop,
    zCross,
    zBow,
    helioCentre: [0, 0, zCross - R_HELIO],
    bowCentre: [0, 0, zBow - R_BOW],
    helioRadius: R_HELIO,
    bowRadius: R_BOW,
  };
}

const smoothstep = (edge0: number, edge1: number, x: number): number => {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
};

/**
 * Shell brightness for a view whose direction makes cosine `cosView` with the surface normal:
 * nearly clear face-on (|cos| = 1), full at a glancing view (cos = 0). The shader uses the
 * same formula.
 */
export const rimGlow = (cosView: number): number =>
  RIM_FLOOR + (1 - RIM_FLOOR) * Math.pow(1 - Math.min(1, Math.abs(cosView)), RIM_POWER);

/** Distance travelled past the heliopause crossing (negative before it). */
const pastCrossing = (cameraZ: number, l: HeliopauseLayout) => l.zCross - cameraZ;

/** Brief brightening of the heliopause shell as the camera crosses it: 0 → 1 → 0 by the stop. */
export function crossingGlow(cameraZ: number, l: HeliopauseLayout): number {
  const s = pastCrossing(cameraZ, l);
  return s < 0 ? smoothstep(-GLOW_LEAD, 0, s) : 1 - smoothstep(0, l.zCross - l.zStop, s);
}

/** Opacity of the nebula and galaxies: 0 in the Solar System, 1 from the heliopause stop on. */
export const deepSkyFade = (cameraZ: number, l: HeliopauseLayout): number =>
  smoothstep(-FADE_LEAD, l.zCross - l.zStop, pastCrossing(cameraZ, l));

/** Whether the shells are near enough to draw. */
export const shellsVisible = (cameraZ: number, l: HeliopauseLayout): boolean =>
  pastCrossing(cameraZ, l) >= -SHELL_DRAW_DISTANCE;
