/**
 * Sky orientation math (no three.js imports). The Milky Way texture is an equirectangular
 * map in galactic coordinates: the Galactic Centre in the middle, longitude increasing to
 * the left and galactic south at the top. Checked against the Magellanic Clouds in tests, and
 * in `?inspect&view=gc`, where the Galactic Centre marker lands on the bright bulge.
 * This module turns that into the rotation that points the voyage's direction of travel
 * (world −Z) at Voyager 1's real heading.
 */
import type { Vec3 } from '../../journey/route';

const RAD = Math.PI / 180;

/** J2000 north galactic pole and the galactic longitude of the north celestial pole. */
const NGP_RA = 192.85948;
const NGP_DEC = 27.12825;
const NCP_L = 122.93192;

/**
 * Voyager 1's outbound direction (RA, Dec in degrees, J2000), in Ophiuchus.
 * VERIFY: published as roughly RA 17h 13m, Dec +12°; refine from a JPL/NASA source.
 */
export const VOYAGER_HEADING: readonly [number, number] = [258.25, 12.0];
/** The north celestial pole (RA, Dec), kept as close to world up as the heading allows. */
export const CELESTIAL_NORTH: readonly [number, number] = [0, 90];

/** Equatorial (RA, Dec) → galactic (l in [0, 360), b), all in degrees. */
export function equatorialToGalactic(ra: number, dec: number): [number, number] {
  const d = dec * RAD;
  const dG = NGP_DEC * RAD;
  const dA = (ra - NGP_RA) * RAD;
  const sinB = Math.sin(d) * Math.sin(dG) + Math.cos(d) * Math.cos(dG) * Math.cos(dA);
  const b = Math.asin(Math.max(-1, Math.min(1, sinB)));
  const y = Math.cos(d) * Math.sin(dA);
  const x = Math.sin(d) * Math.cos(dG) - Math.cos(d) * Math.sin(dG) * Math.cos(dA);
  const l = (((NCP_L - Math.atan2(y, x) / RAD) % 360) + 360) % 360;
  return [l, b / RAD];
}

/** Galactic (l, b) → texture uv in three's convention (v = 1 at the image top). */
export function skyTextureUv(l: number, b: number): [number, number] {
  const u = (((0.5 - l / 360) % 1) + 1) % 1;
  return [u, 0.5 - b / 180];
}

/** Unit direction (in sphere-local space) where three's SphereGeometry puts texture uv (u, v). */
export function textureDirection(u: number, v: number): Vec3 {
  const phi = u * 2 * Math.PI;
  const theta = (1 - v) * Math.PI;
  return [-Math.cos(phi) * Math.sin(theta), Math.cos(theta), Math.sin(phi) * Math.sin(theta)];
}

function localDirection(ra: number, dec: number): Vec3 {
  const [l, b] = equatorialToGalactic(ra, dec);
  const [u, v] = skyTextureUv(l, b);
  return textureDirection(u, v);
}

const dot = (a: Vec3, b: Vec3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a: Vec3, b: Vec3): Vec3 => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];
function normalize(a: Vec3): Vec3 {
  const k = Math.hypot(...a);
  return [a[0] / k, a[1] / k, a[2] / k];
}

/**
 * Rotation (x, y, z, w) for the sky sphere: Voyager's heading → world −Z, with the north
 * celestial pole as close to world +Y as possible.
 */
export function skyQuaternion(): [number, number, number, number] {
  const f = localDirection(...VOYAGER_HEADING);
  const north = localDirection(...CELESTIAL_NORTH);
  const k = dot(north, f);
  const n = normalize([north[0] - k * f[0], north[1] - k * f[1], north[2] - k * f[2]]);
  const r = cross(f, n);
  // Rows of the local → world rotation: r → +X, n → +Y, f → −Z.
  const m11 = r[0],
    m12 = r[1],
    m13 = r[2];
  const m21 = n[0],
    m22 = n[1],
    m23 = n[2];
  const m31 = -f[0],
    m32 = -f[1],
    m33 = -f[2];
  const trace = m11 + m22 + m33;
  if (trace > 0) {
    const s = 0.5 / Math.sqrt(trace + 1);
    return [(m32 - m23) * s, (m13 - m31) * s, (m21 - m12) * s, 0.25 / s];
  }
  if (m11 > m22 && m11 > m33) {
    const s = 2 * Math.sqrt(1 + m11 - m22 - m33);
    return [0.25 * s, (m12 + m21) / s, (m13 + m31) / s, (m32 - m23) / s];
  }
  if (m22 > m33) {
    const s = 2 * Math.sqrt(1 + m22 - m11 - m33);
    return [(m12 + m21) / s, 0.25 * s, (m23 + m32) / s, (m13 - m31) / s];
  }
  const s = 2 * Math.sqrt(1 + m33 - m11 - m22);
  return [(m13 + m31) / s, (m23 + m32) / s, 0.25 * s, (m21 - m12) / s];
}
