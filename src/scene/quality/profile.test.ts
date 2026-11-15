import { describe, expect, it } from 'vitest';
import { drawCount, qualityProfile, stepTier, TIERS } from './profile';

describe('qualityProfile', () => {
  it('keeps today’s settings at high', () => {
    expect(qualityProfile('high')).toEqual({
      maxDpr: 2,
      multisampling: 4,
      bloom: 'full',
      grain: true,
      beltFraction: 1,
      dustFraction: 1,
      starFraction: 1,
      deepSkyFraction: 1,
    });
  });

  it('lightens medium: lower pixel ratio, 2× MSAA, half-resolution bloom, fewer rocks', () => {
    const medium = qualityProfile('medium');
    expect(medium.maxDpr).toBe(1.5);
    expect(medium.multisampling).toBe(2);
    expect(medium.bloom).toBe('half');
    expect(medium.beltFraction).toBeCloseTo(0.6);
    expect(medium.starFraction).toBeCloseTo(0.8);
  });

  it('strips low down to the essentials, keeping several thousand stars', () => {
    const low = qualityProfile('low');
    expect(low).toMatchObject({ maxDpr: 1, multisampling: 0, bloom: 'off', grain: false });
    expect(low.beltFraction).toBeCloseTo(0.35);
    expect(drawCount(4000, low.starFraction)).toBeGreaterThanOrEqual(2000);
    expect(low.deepSkyFraction).toBeLessThan(1);
  });

  it('never gets heavier from high to low', () => {
    for (let i = 1; i < TIERS.length; i++) {
      const lower = qualityProfile(TIERS[i - 1] ?? 'low');
      const higher = qualityProfile(TIERS[i] ?? 'high');
      expect(lower.maxDpr).toBeLessThanOrEqual(higher.maxDpr);
      expect(lower.multisampling).toBeLessThanOrEqual(higher.multisampling);
      expect(lower.beltFraction).toBeLessThanOrEqual(higher.beltFraction);
    }
  });
});

describe('stepTier', () => {
  it('steps one tier and stops at the ends', () => {
    expect(stepTier('high', -1)).toBe('medium');
    expect(stepTier('medium', -1)).toBe('low');
    expect(stepTier('low', -1)).toBe('low');
    expect(stepTier('low', 1)).toBe('medium');
    expect(stepTier('high', 1)).toBe('high');
  });
});

describe('drawCount', () => {
  it('rounds the share and always draws at least one', () => {
    expect(drawCount(100, 0.35)).toBe(35);
    expect(drawCount(3, 0.1)).toBe(1);
    expect(drawCount(0, 1)).toBe(0);
  });
});
