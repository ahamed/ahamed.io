import { describe, expect, it } from 'vitest';
import { FINALE_LEVEL, plasmaGain, plasmaParams } from './plasma';

const layout = { zEris: -7800, zCross: -8260, zEnd: -10400 };

describe('plasmaGain', () => {
  it('is silent before Eris', () => {
    expect(plasmaGain(0, layout)).toBe(0);
    expect(plasmaGain(-5000, layout)).toBe(0);
    expect(plasmaGain(layout.zEris, layout)).toBe(0);
  });

  it('rises to its peak at the heliopause crossing', () => {
    const mid = plasmaGain((layout.zEris + layout.zCross) / 2, layout);
    expect(mid).toBeGreaterThan(0);
    expect(mid).toBeLessThan(1);
    expect(plasmaGain(layout.zCross, layout)).toBe(1);
  });

  it('settles low through the finale', () => {
    expect(plasmaGain(layout.zEnd, layout)).toBeCloseTo(FINALE_LEVEL);
    let previous = 1;
    for (let z = layout.zCross; z >= layout.zEnd; z -= 50) {
      const g = plasmaGain(z, layout);
      expect(g).toBeLessThanOrEqual(previous + 1e-9);
      previous = g;
    }
  });
});

describe('plasmaParams', () => {
  it('glides a 2–3 kHz tone over band-passed noise, quietly', () => {
    const p = plasmaParams();
    expect(p.tone.hz - p.tone.glide).toBeGreaterThanOrEqual(1500);
    expect(p.tone.hz + p.tone.glide).toBeLessThanOrEqual(3000);
    expect(p.noise.bandHz).toBeGreaterThanOrEqual(2000);
    expect(p.level).toBeLessThan(0.05);
  });
});
