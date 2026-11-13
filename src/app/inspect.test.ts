import { describe, expect, it } from 'vitest';
import { shouldInspect } from './inspect';

describe('shouldInspect', () => {
  it('is true in development with ?inspect', () => {
    expect(shouldInspect(true, '?inspect')).toBe(true);
    expect(shouldInspect(true, '?foo=1&inspect')).toBe(true);
  });

  it('is false in development without ?inspect', () => {
    expect(shouldInspect(true, '')).toBe(false);
    expect(shouldInspect(true, '?inspection')).toBe(false);
  });

  it('is always false in production', () => {
    expect(shouldInspect(false, '?inspect')).toBe(false);
  });
});
