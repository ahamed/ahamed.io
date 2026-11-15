import { describe, expect, it } from 'vitest';
import { initialTier, isHandheld, parseForced, textureSet } from './initialTier';

describe('parseForced', () => {
  it('reads ?quality=low|medium|high', () => {
    expect(parseForced('?quality=low')).toBe('low');
    expect(parseForced('?text&quality=medium')).toBe('medium');
    expect(parseForced('?quality=high')).toBe('high');
  });

  it('ignores anything else', () => {
    expect(parseForced('')).toBeNull();
    expect(parseForced('?quality=ultra')).toBeNull();
  });
});

describe('isHandheld', () => {
  it('is a coarse pointer on a viewport narrower than 1024 px', () => {
    expect(isHandheld({ coarse: true, width: 390 })).toBe(true);
    expect(isHandheld({ coarse: true, width: 1366 })).toBe(false);
    expect(isHandheld({ coarse: false, width: 390 })).toBe(false);
  });
});

describe('initialTier', () => {
  it('starts high on a capable desktop', () => {
    expect(initialTier({ forced: null, handheld: false, cores: 8 })).toBe('high');
  });

  it('starts medium on handhelds and on fewer than 4 cores', () => {
    expect(initialTier({ forced: null, handheld: true, cores: 8 })).toBe('medium');
    expect(initialTier({ forced: null, handheld: false, cores: 2 })).toBe('medium');
  });

  it('uses a forced tier as given', () => {
    expect(initialTier({ forced: 'low', handheld: false, cores: 16 })).toBe('low');
    expect(initialTier({ forced: 'high', handheld: true, cores: 2 })).toBe('high');
  });
});

describe('textureSet', () => {
  it('loads 1K maps at low or on handhelds, 2K otherwise', () => {
    expect(textureSet({ tier: 'low', handheld: false })).toBe('1k');
    expect(textureSet({ tier: 'high', handheld: true })).toBe('1k');
    expect(textureSet({ tier: 'medium', handheld: false })).toBe('2k');
    expect(textureSet({ tier: 'high', handheld: false })).toBe('2k');
  });
});
