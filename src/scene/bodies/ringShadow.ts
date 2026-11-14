import type { Vec3 } from '../../journey/route';

/**
 * Saturn's analytic shadows, from the (fixed) direction toward the Sun. Pure; `ringShadowGlsl`
 * below mirrors these functions so the shaders and these tests agree. No shadow maps needed.
 */

export interface Ring {
  centre: Vec3;
  /** Unit normal of the ring plane. */
  normal: Vec3;
  /** Inner and outer ring edges, in the same units as `centre`. */
  inner: number;
  outer: number;
}

/** The Cassini Division, in Saturn radii (117,580–122,170 km / 60,268 km). */
export const CASSINI_DIVISION: readonly [number, number] = [1.95, 2.03];
/** How much a fully opaque ring darkens the planet behind it. */
export const RING_SHADOW_STRENGTH = 0.85;

const dot = (a: Vec3, b: Vec3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];

/** Position across the ring strip: 0 at the inner edge, 1 at the outer edge. */
export const ringCoord = (r: number, inner: number, outer: number): number =>
  (r - inner) / (outer - inner);

/** Whether the ray from `point` toward the Sun hits the sphere (`centre`, `radius`). */
export function planetShadowsRing(point: Vec3, centre: Vec3, radius: number, sun: Vec3): boolean {
  const oc: Vec3 = [point[0] - centre[0], point[1] - centre[1], point[2] - centre[2]];
  const b = dot(oc, sun);
  const c = dot(oc, oc) - radius * radius;
  const h = b * b - c;
  // Hit ahead of the point: the far root -b + sqrt(h) is positive and the near one too.
  return h > 0 && -b - Math.sqrt(h) > 0;
}

/**
 * Light reaching `point` on the planet after the rings: 1 when its sunlight misses the opaque
 * rings, down to 1 - RING_SHADOW_STRENGTH behind a fully opaque ring. `alphaAt` reads the ring
 * strip's opacity at ring coordinate s.
 */
export function ringShadowOnPlanet(
  point: Vec3,
  ring: Ring,
  sun: Vec3,
  alphaAt: (s: number) => number,
): number {
  const denom = dot(sun, ring.normal);
  if (Math.abs(denom) < 1e-6) return 1;
  const toPlane: Vec3 = [
    ring.centre[0] - point[0],
    ring.centre[1] - point[1],
    ring.centre[2] - point[2],
  ];
  const t = dot(toPlane, ring.normal) / denom;
  if (t <= 0) return 1;
  const q: Vec3 = [
    point[0] + t * sun[0] - ring.centre[0],
    point[1] + t * sun[1] - ring.centre[1],
    point[2] + t * sun[2] - ring.centre[2],
  ];
  const r = Math.hypot(...q);
  if (r < ring.inner || r > ring.outer) return 1;
  return 1 - RING_SHADOW_STRENGTH * alphaAt(ringCoord(r, ring.inner, ring.outer));
}

/**
 * GLSL twins of the functions above. Needs `uniform sampler2D uRingStrip` (alpha = opacity)
 * declared by the including shader.
 */
export const ringShadowGlsl = /* glsl */ `
bool planetShadowsRing(vec3 point, vec3 centre, float radius, vec3 sun) {
  vec3 oc = point - centre;
  float b = dot(oc, sun);
  float h = b * b - (dot(oc, oc) - radius * radius);
  return h > 0.0 && -b - sqrt(h) > 0.0;
}

float ringShadowOnPlanet(vec3 point, vec3 centre, vec3 normal, float inner, float outer, vec3 sun) {
  float denom = dot(sun, normal);
  if (abs(denom) < 1e-6) return 1.0;
  float t = dot(centre - point, normal) / denom;
  if (t <= 0.0) return 1.0;
  float r = length(point + t * sun - centre);
  if (r < inner || r > outer) return 1.0;
  float alpha = texture(uRingStrip, vec2((r - inner) / (outer - inner), 0.5)).a;
  return 1.0 - ${String(RING_SHADOW_STRENGTH)} * alpha;
}
`;
