/** Seeded star field on the unit sphere (no three.js imports). */
import { mulberry32 } from '../random';

export interface StarField {
  count: number;
  /** Unit vectors, xyz per star. */
  positions: Float32Array;
  /** Linear RGB in [0, 1], per star. */
  colors: Float32Array;
  /** Point size in CSS pixels, before the device pixel ratio. */
  sizes: Float32Array;
  /** Twinkle phase in [0, 2π). */
  phases: Float32Array;
}

/** Blue-white to orange, weighted toward white like the naked-eye sky. */
const PALETTE: readonly (readonly [number, number, number, number])[] = [
  // r, g, b, cumulative weight
  [0.7, 0.8, 1.0, 0.12],
  [0.85, 0.9, 1.0, 0.35],
  [1.0, 1.0, 1.0, 0.75],
  [1.0, 0.94, 0.82, 0.9],
  [1.0, 0.82, 0.62, 1.0],
];

export function createStarField(count = 4000, seed = 1977): StarField {
  const rand = mulberry32(seed);
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const sizes = new Float32Array(count);
  const phases = new Float32Array(count);

  for (let i = 0; i < count; i++) {
    // Uniform on the sphere.
    const z = 2 * rand() - 1;
    const phi = 2 * Math.PI * rand();
    const r = Math.sqrt(1 - z * z);
    positions[i * 3] = r * Math.cos(phi);
    positions[i * 3 + 1] = r * Math.sin(phi);
    positions[i * 3 + 2] = z;

    sizes[i] = 0.6 + 2.4 * rand() ** 6;

    const pick = rand();
    const color = PALETTE.find((c) => pick <= c[3]) ?? PALETTE[2];
    colors[i * 3] = color?.[0] ?? 1;
    colors[i * 3 + 1] = color?.[1] ?? 1;
    colors[i * 3 + 2] = color?.[2] ?? 1;

    phases[i] = rand() * Math.PI * 2;
  }
  return { count, positions, colors, sizes, phases };
}
