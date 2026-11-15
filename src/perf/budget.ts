// `.js` so the E2E project (node16 resolution) can import this table too.
import type { Tier } from '../scene/quality/profile.js';

/** What one frame may cost on a tier. */
export interface Budget {
  calls: number;
  triangles: number;
  /** Estimated GPU texture memory, render targets included. */
  textureBytes: number;
}

export type BudgetMetric = keyof Budget;

const MB = 1024 * 1024;

/** The per-tier caps, read by both the ?perf overlay and the E2E budget gate. */
export const BUDGETS = {
  high: { calls: 100, triangles: 1_500_000, textureBytes: 64 * MB },
  low: { calls: 50, triangles: 500_000, textureBytes: 24 * MB },
} as const satisfies Record<'high' | 'low', Budget>;

const METRICS: readonly BudgetMetric[] = ['calls', 'triangles', 'textureBytes'];

/** Medium has no caps of its own: it must fit inside high's. */
export const budgetFor = (tier: Tier): Budget => (tier === 'low' ? BUDGETS.low : BUDGETS.high);

/** The metrics of `sample` that exceed the tier's caps, in table order. */
export function overBudget(sample: Budget, tier: Tier): BudgetMetric[] {
  const budget = budgetFor(tier);
  return METRICS.filter((metric) => sample[metric] > budget[metric]);
}
