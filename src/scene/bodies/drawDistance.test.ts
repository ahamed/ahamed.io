import { describe, expect, it } from 'vitest';
import { beltInRange, drawDistance, MIN_DRAW_PIXELS } from './drawDistance';

const FOV = (50 * Math.PI) / 180;

/** On-screen diameter, in pixels, of a sphere of `radius` seen from `distance`. */
const pixels = (radius: number, distance: number, height: number) =>
  (radius * height) / (distance * Math.tan(FOV / 2));

describe('drawDistance', () => {
  it('is where a body shrinks to MIN_DRAW_PIXELS across', () => {
    const d = drawDistance(1.2, FOV, 1080);
    expect(pixels(1.2, d, 1080)).toBeCloseTo(MIN_DRAW_PIXELS, 6);
  });

  it('grows with the radius and with the viewport height', () => {
    expect(drawDistance(2, FOV, 1080)).toBeCloseTo(2 * drawDistance(1, FOV, 1080), 6);
    expect(drawDistance(1, FOV, 2160)).toBeGreaterThan(drawDistance(1, FOV, 1080));
  });

  it('hides a far hero rock but keeps a near one', () => {
    // Phobos (r 1.1) seen from Earth's close point, ~665 units away, on a 1080p screen.
    expect(665).toBeGreaterThan(drawDistance(1.1, FOV, 1080));
    expect(100).toBeLessThan(drawDistance(1.1, FOV, 1080));
  });
});

describe('beltInRange', () => {
  const span = { zStart: -1100, zEnd: -2600 };

  it('is true inside the span', () => {
    expect(beltInRange(-1800, span, 300)).toBe(true);
  });

  it('is true within the margin before and after the span', () => {
    expect(beltInRange(-850, span, 300)).toBe(true);
    expect(beltInRange(-2850, span, 300)).toBe(true);
  });

  it('is false far from the span on either side', () => {
    expect(beltInRange(0, span, 300)).toBe(false);
    expect(beltInRange(-3200, span, 300)).toBe(false);
  });

  it('does not care which end is given first', () => {
    expect(beltInRange(-1800, { zStart: -2600, zEnd: -1100 }, 0)).toBe(true);
  });
});
