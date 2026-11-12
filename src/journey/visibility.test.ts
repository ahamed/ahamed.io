import { describe, expect, it } from 'vitest';
import {
  CLOSE_SIZE,
  OPEN_SIZE,
  apparentSize,
  chooseOpenStop,
  dialogOpacity,
  dialogScale,
} from './visibility';

const fov = (50 * Math.PI) / 180;

describe('apparentSize', () => {
  it('shrinks with distance', () => {
    expect(apparentSize(1, 10, fov)).toBeGreaterThan(apparentSize(1, 20, fov));
  });
});

describe('chooseOpenStop', () => {
  it('has a lower close threshold than open threshold', () => {
    expect(CLOSE_SIZE).toBeLessThan(OPEN_SIZE);
  });

  it('opens once the open threshold is reached', () => {
    expect(chooseOpenStop([OPEN_SIZE], null)).toBe(0);
    expect(chooseOpenStop([OPEN_SIZE - 0.01], null)).toBeNull();
  });

  it('keeps an open dialog open between the thresholds (hysteresis)', () => {
    const between = (OPEN_SIZE + CLOSE_SIZE) / 2;
    expect(chooseOpenStop([between], 0)).toBe(0);
    expect(chooseOpenStop([between], null)).toBeNull();
  });

  it('closes below the close threshold', () => {
    expect(chooseOpenStop([CLOSE_SIZE - 0.01], 0)).toBeNull();
  });

  it('opens only the larger of two qualifying stops', () => {
    expect(chooseOpenStop([0.3, 0.5], null)).toBe(1);
    expect(chooseOpenStop([0.5, 0.3], null)).toBe(0);
  });
});

describe('dialogScale / dialogOpacity', () => {
  it('grow monotonically with size and are clamped', () => {
    const sizes = [0, CLOSE_SIZE, 0.15, 0.25, 0.35, 1];
    const scales = sizes.map(dialogScale);
    const opacities = sizes.map(dialogOpacity);
    for (let i = 1; i < sizes.length; i++) {
      expect(scales[i]).toBeGreaterThanOrEqual(scales[i - 1] ?? 0);
      expect(opacities[i]).toBeGreaterThanOrEqual(opacities[i - 1] ?? 0);
    }
    expect(Math.min(...scales)).toBeGreaterThanOrEqual(0.7);
    expect(Math.max(...scales)).toBeLessThanOrEqual(1);
    expect(Math.max(...opacities)).toBeLessThanOrEqual(1);
  });
});
