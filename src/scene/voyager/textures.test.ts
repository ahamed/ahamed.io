import { describe, expect, it } from 'vitest';
import { crinkleHeight, grooveRGBA, heightToNormalRGBA, roughnessRGBA } from './textures';

describe('crinkleHeight', () => {
  it('has size² values in [0, 1]', () => {
    const h = crinkleHeight(32, 3);
    expect(h).toHaveLength(32 * 32);
    for (const v of h) {
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(1);
    }
  });

  it('is identical for the same seed (deterministic foil)', () => {
    expect(crinkleHeight(32, 9)).toEqual(crinkleHeight(32, 9));
  });

  it('differs for a different seed', () => {
    expect(crinkleHeight(32, 9)).not.toEqual(crinkleHeight(32, 10));
  });

  it('is not flat', () => {
    const h = crinkleHeight(32, 9);
    expect(Math.max(...h) - Math.min(...h)).toBeGreaterThan(0.2);
  });
});

describe('heightToNormalRGBA', () => {
  it('maps a flat field to the straight-up normal', () => {
    const size = 8;
    const rgba = heightToNormalRGBA(new Float32Array(size * size).fill(0.5), size, 1);
    expect(rgba).toHaveLength(size * size * 4);
    for (let i = 0; i < size * size; i++) {
      expect([...rgba.slice(i * 4, i * 4 + 4)]).toEqual([128, 128, 255, 255]);
    }
  });

  it('tilts the normal against a rising x ramp', () => {
    const size = 8;
    const h = new Float32Array(size * size);
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) h[y * size + x] = x / size;
    const rgba = heightToNormalRGBA(h, size, 1);
    // Interior pixel: height rises with +x, so the normal leans toward -x (R < 128).
    const i = (3 * size + 3) * 4;
    expect(rgba[i]).toBeLessThan(128);
    expect(rgba[i + 1]).toBe(128);
  });
});

describe('roughnessRGBA', () => {
  it('writes roughness into the green channel (three.js convention)', () => {
    const size = 4;
    const rgba = roughnessRGBA(new Float32Array(size * size).fill(0.5), size, 0.2, 0.6);
    expect(rgba).toHaveLength(size * size * 4);
    expect(rgba[1]).toBe(Math.round(0.4 * 255));
    expect(rgba[3]).toBe(255);
  });
});

describe('grooveRGBA', () => {
  const size = 64;
  const g = grooveRGBA(size);
  const at = (x: number, y: number) => g[(y * size + x) * 4 + 1];

  it('has size² RGBA pixels', () => {
    expect(g).toHaveLength(size * size * 4);
  });

  it('depends only on the radius (radially symmetric)', () => {
    // Mirror images about the centre are at equal radius.
    expect(at(10, 20)).toBe(at(size - 1 - 10, 20));
    expect(at(10, 20)).toBe(at(10, size - 1 - 20));
    expect(at(10, 20)).toBe(at(20, 10));
  });

  it('varies with radius (grooves)', () => {
    const row = Array.from({ length: size / 2 }, (_, x) => at(size / 2 + x, size / 2));
    expect(new Set(row).size).toBeGreaterThan(3);
  });
});
