import { Quaternion, SphereGeometry, Vector3 } from 'three';
import { describe, expect, it } from 'vitest';
import {
  CELESTIAL_NORTH,
  equatorialToGalactic,
  skyQuaternion,
  skyTextureUv,
  textureDirection,
  VOYAGER_HEADING,
} from './orientation';

const deg = (r: number) => (r * 180) / Math.PI;

describe('equatorialToGalactic', () => {
  it('puts the Galactic Centre (Sgr A*) at l ≈ 0, b ≈ 0', () => {
    const [l, b] = equatorialToGalactic(266.405, -28.936);
    expect(Math.min(l, 360 - l)).toBeLessThan(0.1);
    expect(Math.abs(b)).toBeLessThan(0.1);
  });

  it('puts the north celestial pole at l ≈ 122.93°, b ≈ 27.13°', () => {
    const [l, b] = equatorialToGalactic(0, 90);
    expect(l).toBeCloseTo(122.932, 2);
    expect(b).toBeCloseTo(27.128, 2);
  });
});

describe('skyTextureUv', () => {
  it('maps the Galactic Centre to the middle of the image', () => {
    const [u, v] = skyTextureUv(0, 0);
    expect(u).toBeCloseTo(0.5, 6);
    expect(v).toBeCloseTo(0.5, 6);
  });

  // Measured on 2k_stars_milky_way.jpg (x from left, y from top, as fractions).
  it.each([
    ['Large Magellanic Cloud', 280.5, -32.9, 0.72, 0.315],
    ['Small Magellanic Cloud', 302.8, -44.3, 0.66, 0.25],
  ])('lands the %s where it appears in the texture', (_, l, b, x, yTop) => {
    const [u, v] = skyTextureUv(l, b);
    expect(Math.abs(u - x)).toBeLessThan(0.02);
    expect(Math.abs(1 - v - yTop)).toBeLessThan(0.02);
  });
});

describe('textureDirection', () => {
  it("matches three's SphereGeometry vertices for their uv", () => {
    const sphere = new SphereGeometry(1, 16, 8);
    const pos = sphere.getAttribute('position');
    const uv = sphere.getAttribute('uv');
    for (let i = 0; i < pos.count; i++) {
      const [x, y, z] = textureDirection(uv.getX(i), uv.getY(i));
      expect(x).toBeCloseTo(pos.getX(i), 5);
      expect(y).toBeCloseTo(pos.getY(i), 5);
      expect(z).toBeCloseTo(pos.getZ(i), 5);
    }
    sphere.dispose();
  });
});

describe('skyQuaternion', () => {
  const q = new Quaternion(...skyQuaternion());
  const toWorld = (ra: number, dec: number) => {
    const [l, b] = equatorialToGalactic(ra, dec);
    const [u, v] = skyTextureUv(l, b);
    return new Vector3(...textureDirection(u, v)).applyQuaternion(q);
  };

  it('is a unit quaternion', () => {
    expect(q.length()).toBeCloseTo(1, 9);
  });

  it("points the direction of travel (−Z) at Voyager 1's heading in Ophiuchus", () => {
    const heading = toWorld(...VOYAGER_HEADING);
    expect(deg(heading.angleTo(new Vector3(0, 0, -1)))).toBeLessThan(0.1);
  });

  it('keeps the celestial north pole in the upper hemisphere, square to the heading', () => {
    const north = toWorld(...CELESTIAL_NORTH);
    expect(north.y).toBeGreaterThan(0.9);
    expect(Math.abs(north.x)).toBeLessThan(1e-6);
  });
});
