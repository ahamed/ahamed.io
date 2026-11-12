import { describe, expect, it } from 'vitest';
import { REVEAL_CPS, revealCount } from './typewriter';

describe('revealCount', () => {
  it('starts at zero', () => {
    expect(revealCount(0, 100, false)).toBe(0);
  });

  it('reveals at the configured characters per second', () => {
    expect(revealCount(1000, 500, false)).toBe(REVEAL_CPS);
    expect(revealCount(500, 500, false)).toBe(Math.floor(REVEAL_CPS / 2));
  });

  it('is capped at the text length', () => {
    expect(revealCount(60_000, 42, false)).toBe(42);
  });

  it('reveals everything at once under reduced motion', () => {
    expect(revealCount(0, 42, true)).toBe(42);
  });
});
