import { describe, expect, it } from 'vitest';
import { facingDirection, MOON_PRESETS } from './moonPresets';

/** Texture coordinates (u, v) of a longitude/latitude in an equirectangular map centred on 180°. */
const uvOf = (lonDeg: number, latDeg: number): [number, number] => [
  lonDeg / 360,
  0.5 + latDeg / 180,
];

describe('facingDirection', () => {
  it('maps the map centre to +X with no rotation (three.js sphere convention)', () => {
    const [x, y, z] = facingDirection(0.5, 0.5, 0, 0);
    expect(x).toBeCloseTo(1, 9);
    expect(y).toBeCloseTo(0, 9);
    expect(z).toBeCloseTo(0, 9);
  });

  it('turns Pluto’s heart (Sputnik Planitia, ≈180° E, 25° N) toward the camera (+Z)', () => {
    const { yaw = 0, pitch = 0 } = MOON_PRESETS.pluto;
    const heart = facingDirection(...uvOf(180, 25), yaw, pitch);
    expect(heart[2]).toBeGreaterThan(0.7);
  });

  it('turns Pluto’s and Charon’s unmapped south poles away from the camera', () => {
    for (const id of ['pluto', 'charon'] as const) {
      const { yaw = 0, pitch = 0 } = MOON_PRESETS[id];
      const south = facingDirection(0.5, 0, yaw, pitch);
      expect(south[2], id).toBeLessThan(-0.5);
    }
  });
});
