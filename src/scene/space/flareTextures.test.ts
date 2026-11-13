import { describe, expect, it } from 'vitest';
import { ghostAlpha, ghostRGBA, glowRGBA } from './flareTextures';

const alphaAt = (data: Uint8Array, size: number, x: number, y: number) =>
  data[(y * size + x) * 4 + 3] ?? -1;

describe.each([
  ['glowRGBA', glowRGBA],
  ['ghostRGBA', ghostRGBA],
])('%s', (_, make) => {
  const size = 64;
  const data = make(size);

  it('has size² RGBA pixels', () => {
    expect(data).toHaveLength(size * size * 4);
  });

  it('is visible in the middle and transparent in the corners', () => {
    const centre = alphaAt(data, size, size / 2, size / 2);
    expect(centre).toBeGreaterThan(60);
    for (const [x, y] of [
      [0, 0],
      [size - 1, 0],
      [0, size - 1],
      [size - 1, size - 1],
    ] as const) {
      expect(alphaAt(data, size, x, y)).toBe(0);
    }
  });
});

describe('glowRGBA', () => {
  it('is radially symmetric', () => {
    const size = 64;
    const data = glowRGBA(size);
    // Mirror pixels around the centre (size - 1 - x) are at the same radius.
    for (let y = 0; y < size; y += 5) {
      for (let x = 0; x < size; x += 3) {
        expect(alphaAt(data, size, x, y)).toBe(alphaAt(data, size, y, x));
        expect(alphaAt(data, size, x, y)).toBe(alphaAt(data, size, size - 1 - x, y));
      }
    }
  });
});

describe('ghostAlpha', () => {
  it('has hexagonal symmetry (unchanged by 60° turns)', () => {
    for (let r = 0; r <= 1; r += 0.1) {
      for (let a = 0; a < Math.PI * 2; a += 0.37) {
        const base = ghostAlpha(r * Math.cos(a), r * Math.sin(a));
        const turned = ghostAlpha(r * Math.cos(a + Math.PI / 3), r * Math.sin(a + Math.PI / 3));
        expect(turned).toBeCloseTo(base, 9);
      }
    }
  });

  it('is not simply round', () => {
    const r = 0.8;
    const corner = ghostAlpha(r, 0);
    const edge = ghostAlpha(r * Math.cos(Math.PI / 6), r * Math.sin(Math.PI / 6));
    expect(Math.abs(corner - edge)).toBeGreaterThan(0.01);
  });
});
