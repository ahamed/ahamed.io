/** Quality tiers, lightest first. */
export const TIERS = ['low', 'medium', 'high'] as const;
export type Tier = (typeof TIERS)[number];

export interface QualityProfile {
  /** Upper bound of the canvas pixel ratio. */
  maxDpr: number;
  /** MSAA samples in the post-processing pass (0 = off). */
  multisampling: number;
  bloom: 'full' | 'half' | 'off';
  /** Film grain (also off under reduced motion). */
  grain: boolean;
  /** Shares of instances drawn. */
  beltFraction: number;
  dustFraction: number;
  starFraction: number;
  deepSkyFraction: number;
}

const PROFILES: Record<Tier, QualityProfile> = {
  high: {
    maxDpr: 2,
    multisampling: 4,
    bloom: 'full',
    grain: true,
    beltFraction: 1,
    dustFraction: 1,
    starFraction: 1,
    deepSkyFraction: 1,
  },
  medium: {
    maxDpr: 1.5,
    multisampling: 2,
    bloom: 'half',
    grain: true,
    beltFraction: 0.6,
    dustFraction: 0.6,
    starFraction: 0.8,
    deepSkyFraction: 1,
  },
  low: {
    maxDpr: 1,
    multisampling: 0,
    bloom: 'off',
    grain: false,
    beltFraction: 0.35,
    dustFraction: 0.35,
    // Stars are cheap points; the sky keeps several thousand.
    starFraction: 0.6,
    deepSkyFraction: 0.5,
  },
};

/** What each tier renders. High is the full voyage. */
export const qualityProfile = (tier: Tier): QualityProfile => PROFILES[tier];

/** One tier lighter (−1) or heavier (+1), clamped at both ends. */
export function stepTier(tier: Tier, dir: 1 | -1): Tier {
  const i = Math.min(TIERS.length - 1, Math.max(0, TIERS.indexOf(tier) + dir));
  return TIERS[i] ?? tier;
}

/** How many of `total` instances to draw for a share, never fewer than one (unless none). */
export const drawCount = (total: number, fraction: number): number =>
  total === 0 ? 0 : Math.max(1, Math.round(total * fraction));
