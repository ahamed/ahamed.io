/** RGBA8 data for the Sun's lens-flare textures (no three.js imports). */

/** Soft radial glow: alpha falls from 1 at the centre to 0 at radius 1 (normalised coords). */
function glowAlpha(x: number, y: number): number {
  const r = Math.hypot(x, y);
  if (r >= 1) return 0;
  const k = 1 - r;
  return k * k * k;
}

/**
 * Soft hexagonal ghost (an aperture reflection): a flat-sided disc with a brighter rim.
 * `x`, `y` are normalised to [−1, 1]; 0 outside the hexagon.
 */
export function ghostAlpha(x: number, y: number): number {
  // Distance to a regular hexagon with corners on the x axis, via its 6 edge normals.
  const angle = Math.atan2(y, x);
  const r = Math.hypot(x, y);
  const sector = Math.PI / 3;
  const local = (((angle % sector) + sector) % sector) - sector / 2;
  const d = (r * Math.cos(local)) / Math.cos(Math.PI / 6);
  if (d >= 0.95) return 0;
  const body = 0.35 + 0.65 * (d / 0.95) ** 4;
  const edge = Math.min(1, (0.95 - d) / 0.08);
  return body * edge;
}

function rgba(size: number, alpha: (x: number, y: number) => number, rgb: readonly number[]) {
  const out = new Uint8Array(size * size * 4);
  const half = (size - 1) / 2;
  for (let py = 0; py < size; py++) {
    for (let px = 0; px < size; px++) {
      const a = alpha((px - half) / half, (py - half) / half);
      const i = (py * size + px) * 4;
      out[i] = rgb[0] ?? 255;
      out[i + 1] = rgb[1] ?? 255;
      out[i + 2] = rgb[2] ?? 255;
      out[i + 3] = Math.round(Math.max(0, Math.min(1, a)) * 255);
    }
  }
  return out;
}

/** Warm white glow for the flare's main element. */
export const glowRGBA = (size: number): Uint8Array => rgba(size, glowAlpha, [255, 236, 210]);

/** Faint hexagonal ghost for the flare's secondary elements. */
export const ghostRGBA = (size: number): Uint8Array => rgba(size, ghostAlpha, [210, 225, 255]);
