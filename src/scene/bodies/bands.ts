/**
 * Jupiter's band drift: each latitude slides along the map at its own speed, a smooth stand-in
 * for the zonal winds (fast prograde equator, alternating jets toward the poles). Pure; the GLSL
 * below mirrors it term for term so the shader and these tests agree.
 */

/** `[amplitude in map widths per second, latitude frequency]` of each wind term. */
export const BAND_TERMS: readonly (readonly [number, number])[] = [
  [0.0032, 2],
  [-0.0021, 5],
  [0.0012, 9],
];

/** Map widths per second that the band at texture coordinate `v` (0 south .. 1 north) drifts. */
export function bandSpeed(v: number): number {
  const lat = (v - 0.5) * Math.PI;
  let speed = 0;
  for (const [amplitude, k] of BAND_TERMS) speed += amplitude * Math.cos(k * lat);
  return speed;
}

/** Horizontal map offset of the band at `v` after `t` seconds of drift. */
export const bandOffset = (v: number, t: number): number => (t === 0 ? 0 : t * bandSpeed(v));

const glslFloat = (x: number) => (Number.isInteger(x) ? `${String(x)}.0` : String(x));

/** GLSL twin of `bandOffset`, as `float bandOffset(float v, float t)`. */
export const bandOffsetGlsl = `
float bandOffset(float v, float t) {
  float lat = (v - 0.5) * 3.14159265358979;
  float speed = 0.0;
${BAND_TERMS.map(([a, k]) => `  speed += ${glslFloat(a)} * cos(${glslFloat(k)} * lat);`).join('\n')}
  return t * speed;
}
`;
