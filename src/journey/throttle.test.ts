import { describe, expect, it } from 'vitest';
import {
  boostFor,
  cruiseSpeed,
  dampBoost,
  inputActive,
  KEY_INTENSITY,
  MAX_BOOST,
  THROTTLE_HOLD_MS,
  throttleSpeed,
  wheelIntensity,
} from './throttle';

const run = (from: number, step: (v: number, dt: number) => number, seconds: number) => {
  let v = from;
  for (let i = 0; i < seconds * 60; i++) v = step(v, 1 / 60);
  return v;
};

describe('cruiseSpeed', () => {
  it('crosses the mean gap between close points in 4 s', () => {
    expect(cruiseSpeed([0, 0.2, 0.6])).toBeCloseTo(0.3 / 4);
  });
});

describe('throttleSpeed', () => {
  const cruise = 0.01;

  it('eases up to cruise speed while input is active, either way', () => {
    expect(run(0, (v, dt) => throttleSpeed(v, 1, cruise, dt), 1)).toBeCloseTo(cruise, 4);
    expect(run(0, (v, dt) => throttleSpeed(v, -1, cruise, dt), 1)).toBeCloseTo(-cruise, 4);
  });

  it('comes to rest within about half a second of the input going idle', () => {
    const v = run(cruise, (v, dt) => throttleSpeed(v, 0, cruise, dt), 0.5);
    expect(Math.abs(v)).toBeLessThan(cruise * 0.05);
  });

  it('never jumps between frames', () => {
    expect(Math.abs(throttleSpeed(0, 1, cruise, 1 / 60))).toBeLessThan(cruise * 0.2);
  });
});

describe('inputActive', () => {
  it('holds input active for a short window after the last event', () => {
    expect(inputActive(1000, 1000 - THROTTLE_HOLD_MS + 1)).toBe(true);
    expect(inputActive(1000, 1000 - THROTTLE_HOLD_MS - 1)).toBe(false);
  });
});

describe('boost', () => {
  it('maps intensity to a clock rate from 1× up to 2.5×', () => {
    expect(MAX_BOOST).toBe(2.5);
    expect(boostFor(0)).toBe(1);
    expect(boostFor(0.5)).toBeCloseTo(1.75);
    expect(boostFor(1)).toBe(2.5);
    expect(boostFor(9)).toBe(2.5);
    expect(boostFor(-1)).toBe(1);
  });

  it('eases back to 1× within about half a second', () => {
    expect(run(2.5, (b, dt) => dampBoost(b, 1, dt), 0.5)).toBeLessThan(1.1);
  });

  it('reads a fast wheel as full intensity and keys as half', () => {
    expect(wheelIntensity(3000)).toBeCloseTo(1);
    expect(wheelIntensity(600)).toBeCloseTo(0.2);
    expect(KEY_INTENSITY).toBe(0.5);
  });
});
