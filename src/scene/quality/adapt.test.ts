import { describe, expect, it } from 'vitest';
import { adaptTier, startAdapt } from './adapt';

describe('adaptTier', () => {
  it('steps one tier down on a slow frame rate and back up on a fast one', () => {
    let state = startAdapt({ tier: 'high', ceiling: 'high', forced: false });
    state = adaptTier(state, 'down');
    expect(state.tier).toBe('medium');
    state = adaptTier(state, 'down');
    expect(state.tier).toBe('low');
    state = adaptTier(state, 'down');
    expect(state.tier).toBe('low');
  });

  it('never rises above the ceiling (a handheld’s starting tier)', () => {
    let state = startAdapt({ tier: 'medium', ceiling: 'medium', forced: false });
    state = adaptTier(state, 'up');
    expect(state.tier).toBe('medium');
  });

  it('settles on the lower tier after three changes of direction', () => {
    let state = startAdapt({ tier: 'high', ceiling: 'high', forced: false });
    for (const dir of ['down', 'up', 'down', 'up'] as const) state = adaptTier(state, dir);
    expect(state.settled).toBe(true);
    expect(state.tier).toBe('medium');
    expect(adaptTier(state, 'up').tier).toBe('medium');
    expect(adaptTier(state, 'down').tier).toBe('medium');
  });

  it('does not adapt a forced tier', () => {
    const state = startAdapt({ tier: 'low', ceiling: 'low', forced: true });
    expect(state.settled).toBe(true);
    expect(adaptTier(state, 'up').tier).toBe('low');
  });

  it('returns the same state when nothing changes', () => {
    const state = startAdapt({ tier: 'low', ceiling: 'high', forced: false });
    expect(adaptTier(state, 'down')).toBe(state);
  });
});
