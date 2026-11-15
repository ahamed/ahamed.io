import { describe, expect, it } from 'vitest';
import { countdown, earthDistanceAu, formatDelay, lightSeconds } from './signal';

describe('lightSeconds', () => {
  it('is about 499 s per AU', () => {
    expect(lightSeconds(1)).toBeCloseTo(499, 0);
    expect(lightSeconds(121.6) / 3600).toBeCloseTo(16.85, 1);
  });
});

describe('earthDistanceAu', () => {
  it('is the distance from Earth on the way out: 0 at launch, AU − 1.01 after', () => {
    expect(earthDistanceAu(1.01)).toBe(0);
    expect(earthDistanceAu(0.5)).toBe(0);
    expect(earthDistanceAu(121.6)).toBeCloseTo(120.59);
  });
});

describe('countdown', () => {
  it('counts down from the full light time, one second per second at rest', () => {
    expect(countdown(100, 0)).toBe(100);
    expect(countdown(100, 3)).toBe(97);
  });

  it('starts again from the full light time when it reaches zero', () => {
    expect(countdown(100, 100)).toBe(100);
    expect(countdown(100, 130)).toBe(70);
  });

  it('holds a zero light time at zero', () => {
    expect(countdown(0, 5)).toBe(0);
  });
});

describe('formatDelay', () => {
  it('shows tenths of a second below a minute', () => {
    expect(formatDelay(1.27)).toBe('1.3 s');
  });

  it('shows minutes and seconds below an hour', () => {
    expect(formatDelay(499.2)).toBe('8m 19s');
  });

  it('shows hours, minutes and padded seconds from an hour up', () => {
    expect(formatDelay(60_678)).toBe('16h 51m 18s');
    expect(formatDelay(3607)).toBe('1h 00m 07s');
  });
});
