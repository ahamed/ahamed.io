import { describe, expect, it } from 'vitest';
import { atmosphereGlow, impactRadius } from './atmosphere';

const shell = { scale: 1.1, power: 2.5, innerPower: 8 };

describe('impactRadius', () => {
  it('is the shell radius where the view grazes the shell, and the limb at sqrt(1 - 1/s²)', () => {
    expect(impactRadius(0, 1.1)).toBeCloseTo(1.1);
    expect(impactRadius(Math.sqrt(1 - 1 / 1.1 ** 2), 1.1)).toBeCloseTo(1);
  });
});

describe('atmosphereGlow', () => {
  it('peaks at the planet limb', () => {
    expect(atmosphereGlow(1, shell)).toBeCloseTo(1);
  });

  it('fades to nothing at the shell edge, with no hard border', () => {
    expect(atmosphereGlow(shell.scale, shell)).toBe(0);
    // Just inside the edge the glow is already near zero, so the halo blurs into space.
    expect(atmosphereGlow(shell.scale - 0.1 * (shell.scale - 1), shell)).toBeLessThan(0.01);
  });

  it('falls off steadily from the limb out into space', () => {
    let previous = Infinity;
    for (let rho = 1; rho <= shell.scale; rho += 0.01) {
      const glow = atmosphereGlow(rho, shell);
      expect(glow).toBeLessThanOrEqual(previous);
      previous = glow;
    }
  });

  it('hazes only the edge of the disc, not its face', () => {
    expect(atmosphereGlow(0.5, shell)).toBeLessThan(0.01);
    expect(atmosphereGlow(0.95, shell)).toBeGreaterThan(atmosphereGlow(0.8, shell));
    expect(atmosphereGlow(0.999, shell)).toBeCloseTo(1, 1);
  });
});
