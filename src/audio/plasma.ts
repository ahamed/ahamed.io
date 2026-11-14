/** Where the plasma texture swells: Eris, the heliopause crossing and the route's end (world z). */
export interface PlasmaLayout {
  zEris: number;
  zCross: number;
  zEnd: number;
}

/** Share of the peak the texture keeps through the finale. */
export const FINALE_LEVEL = 0.25;

const smoothstep = (t: number): number => {
  const x = Math.min(1, Math.max(0, t));
  return x * x * (3 - 2 * x);
};

/**
 * The plasma texture's level (0..1) at camera z (travel is toward −Z): silent before Eris,
 * rising to 1 at the heliopause crossing, then easing down to FINALE_LEVEL by the end.
 */
export function plasmaGain(z: number, { zEris, zCross, zEnd }: PlasmaLayout): number {
  if (z >= zEris) return 0;
  if (z >= zCross) return smoothstep((zEris - z) / (zEris - zCross));
  return 1 - (1 - FINALE_LEVEL) * smoothstep((zCross - z) / (zCross - zEnd));
}

export interface PlasmaParams {
  /** A sine whose pitch glides ±`glide` Hz at `lfoHz`, like Voyager's plasma-wave tones. */
  tone: { hz: number; glide: number; lfoHz: number; level: number };
  noise: { bandHz: number; q: number; level: number };
  /** Output gain at the peak (plasmaGain 1), before mute. */
  level: number;
}

export const plasmaParams = (): PlasmaParams => ({
  tone: { hz: 2200, glide: 600, lfoHz: 0.05, level: 0.6 },
  noise: { bandHz: 2500, q: 8, level: 1 },
  level: 0.03,
});
