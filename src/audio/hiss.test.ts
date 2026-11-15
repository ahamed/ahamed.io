import { describe, expect, it } from 'vitest';
import { createFakeAudioContext } from '../test/fakeAudio';
import { blipParams } from './blip';
import { hissParams, playHiss } from './hiss';

describe('hissParams', () => {
  const params = hissParams();

  it('lasts about 0.2 s', () => {
    expect(params.attack + params.decay).toBeGreaterThanOrEqual(0.15);
    expect(params.attack + params.decay).toBeLessThanOrEqual(0.25);
  });

  it('stays well below the blip', () => {
    expect(params.peakGain).toBeLessThan(blipParams().peakGain / 2);
  });

  it('is band-passed noise in the upper midrange', () => {
    expect(params.bandHz).toBeGreaterThan(1000);
    expect(params.bandHz).toBeLessThan(6000);
  });
});

describe('playHiss', () => {
  it('plays the given noise buffer through a band-pass and a gain envelope from silence', () => {
    const { ctx, calls } = createFakeAudioContext();
    const buffer = ctx.createBuffer(1, 100, ctx.sampleRate);
    const params = hissParams();
    const source = playHiss(ctx, params, buffer);
    expect(source.buffer).toBe(buffer);
    const end = ctx.currentTime + params.attack + params.decay;
    expect(calls.find((c) => c.method === 'stop')?.args[0]).toBeCloseTo(end, 5);
    expect(calls.find((c) => c.method === 'frequency.set')?.args[0]).toBe(params.bandHz);
    const gainSet = calls.find((c) => c.method === 'gain.set');
    expect(gainSet?.args[0]).toBeLessThan(0.001);
    expect(calls.some((c) => c.method === 'gain.linear' && c.args[0] === params.peakGain)).toBe(
      true,
    );
    expect(calls.some((c) => c.method === 'gain.exp')).toBe(true);
  });
});
