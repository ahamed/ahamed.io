import { describe, expect, it } from 'vitest';
import { createQualityStore } from './store';

describe('createQualityStore', () => {
  it('starts a desktop at high with 2K maps and lets it adapt both ways', () => {
    const store = createQualityStore({ forced: null, handheld: false, cores: 8 });
    expect(store.getState()).toMatchObject({ tier: 'high', textureSet: '2k', handheld: false });
    store.getState().step('down');
    expect(store.getState().tier).toBe('medium');
    store.getState().step('up');
    expect(store.getState().tier).toBe('high');
  });

  it('starts a handheld at medium with 1K maps and never rises above it', () => {
    const store = createQualityStore({ forced: null, handheld: true, cores: 8 });
    expect(store.getState()).toMatchObject({ tier: 'medium', textureSet: '1k' });
    store.getState().step('up');
    expect(store.getState().tier).toBe('medium');
  });

  it('keeps a forced tier', () => {
    const store = createQualityStore({ forced: 'low', handheld: false, cores: 8 });
    expect(store.getState()).toMatchObject({ tier: 'low', textureSet: '1k', forced: true });
    store.getState().step('up');
    expect(store.getState().tier).toBe('low');
  });

  it('keeps the texture set when the tier changes', () => {
    const store = createQualityStore({ forced: null, handheld: false, cores: 8 });
    store.getState().step('down');
    store.getState().step('down');
    expect(store.getState().tier).toBe('low');
    expect(store.getState().textureSet).toBe('2k');
  });
});
