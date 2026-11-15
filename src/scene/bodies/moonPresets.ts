import type { Vec3 } from '../../journey/route';

export type MoonPresetId =
  | 'io'
  | 'europa'
  | 'ganymede'
  | 'callisto'
  | 'titan'
  | 'rhea'
  | 'iapetus'
  | 'enceladus'
  | 'pluto'
  | 'charon';

interface MoonPreset {
  /** Multiplied with the map: tints the greyscale mosaics toward each moon's real colour. */
  tint: string;
  roughness: number;
  /** Optional haze rim (Titan). */
  haze?: string;
  /** Turn about the body's axis (rad), applied first: picks the longitude facing the camera. */
  yaw?: number;
  /** Tilt of the north pole toward the camera (+Z, rad), applied after `yaw`. */
  pitch?: number;
}

/** Pluto and Charon: map centre turned to the camera, north tilted toward it, so the unmapped
 * south (in darkness during the New Horizons flyby) faces away. */
const NEW_HORIZONS_VIEW = { yaw: -Math.PI / 2, pitch: 1.0 };

/**
 * The textured moons and dwarf planets. Io and Ganymede use colour mosaics, so they stay
 * untinted; the others are greyscale mosaics tinted toward their true colour. Each spins about
 * its pole (see `spin.ts`); `yaw` and `pitch` set its resting pose.
 */
export const MOON_PRESETS: Record<MoonPresetId, MoonPreset> = {
  io: { tint: '#ffffff', roughness: 0.9 },
  europa: { tint: '#efe4d2', roughness: 0.7 },
  ganymede: { tint: '#ffffff', roughness: 0.9 },
  callisto: { tint: '#b3a593', roughness: 1 },
  titan: { tint: '#e8b878', roughness: 1, haze: '#d9893a' },
  rhea: { tint: '#dedad5', roughness: 0.9 },
  iapetus: { tint: '#e3d7c4', roughness: 0.95 },
  enceladus: { tint: '#ffffff', roughness: 0.6 },
  // The heart (Sputnik Planitia) is at the map centre, so it faces the camera.
  pluto: { tint: '#e9d3b8', roughness: 0.9, ...NEW_HORIZONS_VIEW },
  charon: { tint: '#bdb8b2', roughness: 0.95, ...NEW_HORIZONS_VIEW },
};

/**
 * World direction of the surface point at texture coordinate (u, v) on a three.js
 * SphereGeometry turned by `yaw` about Y, then `pitch` about X (the component's nesting).
 */
export function facingDirection(u: number, v: number, yaw: number, pitch: number): Vec3 {
  const phi = u * 2 * Math.PI;
  const theta = (1 - v) * Math.PI;
  const x0 = -Math.cos(phi) * Math.sin(theta);
  const y0 = Math.cos(theta);
  const z0 = Math.sin(phi) * Math.sin(theta);
  // Rotate about Y by yaw.
  const x1 = x0 * Math.cos(yaw) + z0 * Math.sin(yaw);
  const z1 = -x0 * Math.sin(yaw) + z0 * Math.cos(yaw);
  // Rotate about X by pitch.
  const y2 = y0 * Math.cos(pitch) - z1 * Math.sin(pitch);
  const z2 = y0 * Math.sin(pitch) + z1 * Math.cos(pitch);
  return [x1, y2, z2];
}
