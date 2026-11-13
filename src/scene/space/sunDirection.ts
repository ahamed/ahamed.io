import type { Vec3 } from '../../journey/route';

const KEY = [-40, 18, 30] as const;
const KEY_LENGTH = Math.hypot(...KEY);

/**
 * Unit vector from any point toward the Sun, which sits at infinity behind and above the
 * chase camera. The key light, Voyager's reflections, the Sun disc and the flare all use it.
 */
export const SUN_DIRECTION: Readonly<Vec3> = [
  KEY[0] / KEY_LENGTH,
  KEY[1] / KEY_LENGTH,
  KEY[2] / KEY_LENGTH,
];

/** The Sun's apparent position `distance` units from `origin`, written into `out`. */
export function sunPositionInto(out: Vec3, origin: Readonly<Vec3>, distance: number): Vec3 {
  out[0] = origin[0] + SUN_DIRECTION[0] * distance;
  out[1] = origin[1] + SUN_DIRECTION[1] * distance;
  out[2] = origin[2] + SUN_DIRECTION[2] * distance;
  return out;
}
