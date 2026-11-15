import { describe, expect, it } from 'vitest';
import { HINT_IDLE_MS, HINT_MS, hintVisible, type HintInput } from './hint';

const base: HintInput = { shownForMs: 0, movesSinceShown: 0, idleAtEarthMs: 0 };

describe('hintVisible', () => {
  it('shows right after the intro', () => {
    expect(hintVisible(base)).toBe(true);
  });

  it('fades after two moves', () => {
    expect(hintVisible({ ...base, movesSinceShown: 1 })).toBe(true);
    expect(hintVisible({ ...base, movesSinceShown: 2 })).toBe(false);
  });

  it('fades after 8 seconds', () => {
    expect(HINT_MS).toBe(8000);
    expect(hintVisible({ ...base, shownForMs: HINT_MS - 1 })).toBe(true);
    expect(hintVisible({ ...base, shownForMs: HINT_MS })).toBe(false);
  });

  it('comes back after 20 s idle at Earth', () => {
    expect(HINT_IDLE_MS).toBe(20_000);
    const faded = { shownForMs: 30_000, movesSinceShown: 5 };
    expect(hintVisible({ ...faded, idleAtEarthMs: HINT_IDLE_MS - 1 })).toBe(false);
    expect(hintVisible({ ...faded, idleAtEarthMs: HINT_IDLE_MS })).toBe(true);
  });
});
