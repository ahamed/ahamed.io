import { Euler, Vector3 } from 'three';
import { describe, expect, it } from 'vitest';
import { dishAxisInto, VOYAGER_ORIENTATION, VOYAGER_SCALE } from './orientation';

const DEG = Math.PI / 180;

describe('Voyager orientation', () => {
  it('turns the dish away from the chase camera, a little off the line of sight', () => {
    const axis = dishAxisInto([0, 0, 0]);
    const [x, y, z] = axis;
    expect(Math.hypot(x, y, z)).toBeCloseTo(1, 9);
    // The chase camera sits on +Z behind the craft; the dish must face -Z (direction of travel).
    expect(z).toBeLessThan(0);
    const offAxis = Math.acos(-z);
    expect(offAxis).toBeGreaterThanOrEqual(10 * DEG);
    expect(offAxis).toBeLessThanOrEqual(45 * DEG);
  });

  it('matches three.js applying the same Euler to the model dish axis', () => {
    const expected = new Vector3(0, 0, 1).applyEuler(new Euler(...VOYAGER_ORIENTATION, 'XYZ'));
    const [x, y, z] = dishAxisInto([0, 0, 0]);
    expect(x).toBeCloseTo(expected.x, 9);
    expect(y).toBeCloseTo(expected.y, 9);
    expect(z).toBeCloseTo(expected.z, 9);
  });

  it('is a half turn plus a nonzero yaw and pitch, with no roll', () => {
    const [pitch, yaw, roll] = VOYAGER_ORIENTATION;
    expect(pitch).not.toBe(0);
    expect(Math.abs(yaw - Math.PI)).toBeGreaterThan(0);
    expect(Math.abs(yaw - Math.PI)).toBeLessThan(45 * DEG);
    expect(roll).toBe(0);
  });

  it('draws Voyager about a third larger than the M1 scale of 0.45', () => {
    expect(VOYAGER_SCALE / 0.45).toBeGreaterThanOrEqual(1.25);
    expect(VOYAGER_SCALE / 0.45).toBeLessThanOrEqual(1.4);
  });
});
