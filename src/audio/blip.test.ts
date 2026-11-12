import { describe, expect, it } from 'vitest';
import { blipParams, playBlip } from './blip';
import { createFakeAudioContext } from '../test/fakeAudio';

describe('blipParams', () => {
  const params = blipParams();

  it('is shorter than 250 ms', () => {
    expect(params.attack + params.decay).toBeLessThan(0.25);
  });

  it('peaks at or below 0.15 gain', () => {
    expect(params.peakGain).toBeLessThanOrEqual(0.15);
  });

  it('sweeps downward', () => {
    for (const voice of params.voices) expect(voice.endHz).toBeLessThan(voice.startHz);
  });
});

describe('playBlip', () => {
  it('schedules every voice and stops them after the envelope', () => {
    const { ctx, calls } = createFakeAudioContext();
    const params = blipParams();
    playBlip(ctx, params);

    const starts = calls.filter((c) => c.method === 'start');
    const stops = calls.filter((c) => c.method === 'stop');
    expect(starts).toHaveLength(params.voices.length);
    expect(stops).toHaveLength(params.voices.length);
    for (const stop of stops) {
      expect(stop.args[0]).toBeCloseTo(ctx.currentTime + params.attack + params.decay, 5);
    }
    expect(calls.some((c) => c.method === 'gain.exp')).toBe(true);
    expect(calls.some((c) => c.method === 'frequency.exp')).toBe(true);
  });
});
