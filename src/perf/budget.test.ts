import { describe, expect, it } from 'vitest';
import { BUDGETS, budgetFor, overBudget } from './budget';

const MB = 1024 * 1024;

describe('budget', () => {
  it('caps high at 100 draw calls, 1.5 M triangles and 64 MB of textures', () => {
    expect(BUDGETS.high).toEqual({ calls: 100, triangles: 1_500_000, textureBytes: 64 * MB });
  });

  it('caps low at 50 draw calls, 0.5 M triangles and 24 MB of textures', () => {
    expect(BUDGETS.low).toEqual({ calls: 50, triangles: 500_000, textureBytes: 24 * MB });
  });

  it('uses the high caps for medium', () => {
    expect(budgetFor('medium')).toBe(BUDGETS.high);
  });

  it('lists nothing when a sample is at or under every cap', () => {
    expect(overBudget({ calls: 100, triangles: 1_500_000, textureBytes: 64 * MB }, 'high')).toEqual(
      [],
    );
  });

  it('lists each metric over its cap', () => {
    expect(overBudget({ calls: 51, triangles: 10, textureBytes: 25 * MB }, 'low')).toEqual([
      'calls',
      'textureBytes',
    ]);
  });
});
