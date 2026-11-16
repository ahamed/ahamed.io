import { describe, expect, it } from 'vitest';
import { autoplaySlingSpeed, brakeCap, COAST_RATE, coastSpeed } from './sling';

const integrate = (speed: (t: number) => number, seconds: number) => {
  let d = 0;
  const dt = 1 / 600;
  for (let t = 0; t < seconds; t += dt) d += speed(t) * dt;
  return d;
};

describe('coastSpeed', () => {
  const D = 0.009;
  const vExit = 0.0003;

  it('starts at the lap exit speed, so the hand-off has no jump', () => {
    expect(coastSpeed(0, D, vExit)).toBeCloseTo(vExit);
  });

  it('rises like a kick, then eases out to rest', () => {
    expect(coastSpeed(0.3, D, vExit)).toBeGreaterThan(vExit);
    expect(coastSpeed(8, D, vExit)).toBeLessThan(vExit * 0.1);
    const peak = 1 / COAST_RATE;
    expect(coastSpeed(peak + 1, D, vExit)).toBeLessThan(coastSpeed(peak + 0.5, D, vExit));
  });

  it('covers the coast distance in total', () => {
    expect(integrate((t) => coastSpeed(t, D, vExit), 20)).toBeCloseTo(D, 4);
  });
});

describe('autoplaySlingSpeed', () => {
  const cruise = 0.007;
  const vExit = 0.0003;

  it('starts at the exit speed, rises above cruise, then settles back to cruise', () => {
    expect(autoplaySlingSpeed(0, cruise, vExit)).toBeCloseTo(vExit);
    let peak = 0;
    for (let t = 0; t < 6; t += 0.05) peak = Math.max(peak, autoplaySlingSpeed(t, cruise, vExit));
    expect(peak).toBeGreaterThan(cruise * 1.2);
    expect(autoplaySlingSpeed(10, cruise, vExit)).toBeCloseTo(cruise, 4);
  });
});

describe('brakeCap', () => {
  it('limits speed to the lap entry speed at the capture point and grows with distance', () => {
    expect(brakeCap(0, 0.0003)).toBeCloseTo(0.0003);
    expect(brakeCap(0.004, 0.0003)).toBeGreaterThan(brakeCap(0.002, 0.0003));
    expect(brakeCap(-1, 0.0003)).toBeCloseTo(0.0003);
  });
});
