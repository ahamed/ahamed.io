import { describe, expect, it } from 'vitest';
import { resolveTexture } from './ktx2';

describe('resolveTexture', () => {
  it('swaps 2K maps for their 1K versions in the 1K set', () => {
    expect(resolveTexture('2k_earth_daymap', '1k')).toBe('1k_earth_daymap');
    expect(resolveTexture('2k_saturn_ring_alpha', '1k')).toBe('1k_saturn_ring_alpha');
  });

  it('keeps 2K maps in the 2K set, and 1K-only maps in either set', () => {
    expect(resolveTexture('2k_mars', '2k')).toBe('2k_mars');
    expect(resolveTexture('1k_io', '1k')).toBe('1k_io');
    expect(resolveTexture('1k_io', '2k')).toBe('1k_io');
  });
});
