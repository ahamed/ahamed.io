import { stepTier, TIERS, type Tier } from './profile';

/** Direction changes after which the tier stops adapting. */
const MAX_TURNS = 3;

export interface AdaptState {
  tier: Tier;
  /** Highest tier allowed: a handheld never rises above where it started. */
  ceiling: Tier;
  /** The last step taken, to count changes of direction. */
  last: 'down' | 'up' | null;
  turns: number;
  /** Lowest tier reached, kept once settled. */
  lowest: Tier;
  /** Forced, or flip-flopped too often: no more changes. */
  settled: boolean;
}

export const startAdapt = ({
  tier,
  ceiling,
  forced,
}: {
  tier: Tier;
  ceiling: Tier;
  forced: boolean;
}): AdaptState => ({ tier, ceiling, last: null, turns: 0, lowest: tier, settled: forced });

const rank = (tier: Tier): number => TIERS.indexOf(tier);

/**
 * The next state after the frame rate stayed low ('down') or high ('up'): one tier, clamped
 * by the ceiling. After MAX_TURNS changes of direction it settles on the lowest tier seen.
 * Returns `state` itself when nothing changes.
 */
export function adaptTier(state: AdaptState, direction: 'down' | 'up'): AdaptState {
  if (state.settled) return state;
  const next = stepTier(state.tier, direction === 'down' ? -1 : 1);
  const tier = rank(next) > rank(state.ceiling) ? state.ceiling : next;
  if (tier === state.tier) return state;
  const turns = state.last !== null && state.last !== direction ? state.turns + 1 : state.turns;
  const lowest = rank(tier) < rank(state.lowest) ? tier : state.lowest;
  if (turns >= MAX_TURNS) {
    return { ...state, tier: lowest, last: direction, turns, lowest, settled: true };
  }
  return { ...state, tier, last: direction, turns, lowest };
}

/** Measure the frame rate once the boot panel is gone (loading spikes would skew it). */
export const isMeasuring = (phase: 'boot' | 'intro' | 'voyage', forced: boolean): boolean =>
  !forced && phase !== 'boot';

/**
 * PerformanceMonitor bounds for a refresh rate: step down under 45 fps (30 on handhelds), step
 * up over 90% of the refresh rate, capped at 90 fps.
 */
export const frameBounds =
  (handheld: boolean) =>
  (refreshRate: number): [number, number] =>
    handheld ? [30, 55] : [45, Math.min(refreshRate, 90) * 0.9];
