import { describe, expect, it } from 'vitest';
import { blipParams } from './blip';
import { droneParams } from './drone';

describe('droneParams', () => {
  const drone = droneParams();

  it('is two or three detuned low oscillators', () => {
    expect(drone.oscillators.length).toBeGreaterThanOrEqual(2);
    expect(drone.oscillators.length).toBeLessThanOrEqual(3);
    for (const osc of drone.oscillators) expect(osc.hz).toBeLessThan(200);
    expect(drone.oscillators.some((o) => o.detune !== 0)).toBe(true);
  });

  it('sits well below the blip and fades in over about 4 s', () => {
    expect(drone.gain).toBeLessThan(blipParams().peakGain / 2);
    expect(drone.fadeIn).toBeCloseTo(4);
  });

  it('breathes slowly: about a 12 s volume cycle, with a low-passed hiss', () => {
    expect(1 / drone.ampLfo.hz).toBeGreaterThan(10);
    expect(1 / drone.ampLfo.hz).toBeLessThan(15);
    expect(drone.filter.hz).toBeLessThan(600);
    expect(drone.noise.gain).toBeGreaterThan(0);
    expect(drone.noise.gain).toBeLessThan(drone.gain);
  });
});
