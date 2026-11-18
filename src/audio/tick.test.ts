import { describe, expect, it } from 'vitest';
import { createFakeAudioContext } from '../test/fakeAudio';
import { blipParams } from './blip';
import { MIN_TICK_GAP_MS, playTick, shouldTick, TICK_BOUNDS, tickParams } from './tick';

describe('tickParams', () => {
  it('is a short click, well under 40 ms and quieter than the blip', () => {
    for (const r of [0, 0.5, 1]) {
      const p = tickParams(() => r);
      expect(p.attack + p.decay).toBeLessThan(0.04);
      expect(p.peakGain).toBeLessThan(blipParams().peakGain);
    }
  });

  it('varies pitch and level a little, always within bounds', () => {
    let seed = 7;
    const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    const pitches = new Set<number>();
    for (let i = 0; i < 200; i++) {
      const p = tickParams(rand);
      expect(p.bandHz).toBeGreaterThanOrEqual(TICK_BOUNDS.minHz);
      expect(p.bandHz).toBeLessThanOrEqual(TICK_BOUNDS.maxHz);
      expect(p.peakGain).toBeGreaterThanOrEqual(TICK_BOUNDS.minGain);
      expect(p.peakGain).toBeLessThanOrEqual(TICK_BOUNDS.maxGain);
      pitches.add(Math.round(p.bandHz));
    }
    expect(pitches.size).toBeGreaterThan(10);
  });
});

describe('shouldTick', () => {
  it('skips whitespace', () => {
    expect(shouldTick(' ', 1000, -Infinity)).toBe(false);
    expect(shouldTick('\n', 1000, -Infinity)).toBe(false);
    expect(shouldTick('a', 1000, -Infinity)).toBe(true);
  });

  it('allows at most about 30 ticks a second', () => {
    expect(MIN_TICK_GAP_MS).toBeGreaterThanOrEqual(1000 / 30);
    expect(shouldTick('a', 1000, 1000 - MIN_TICK_GAP_MS + 1)).toBe(false);
    expect(shouldTick('a', 1000, 1000 - MIN_TICK_GAP_MS)).toBe(true);
  });
});

describe('playTick', () => {
  it('plays a slice of the noise buffer through a band-pass and a gain envelope', () => {
    const { ctx, calls } = createFakeAudioContext();
    const buffer = ctx.createBuffer(1, 100, ctx.sampleRate);
    const params = tickParams(() => 0.5);
    const source = playTick(ctx, params, buffer);
    expect(source.buffer).toBe(buffer);
    expect(calls.find((c) => c.method === 'frequency.set')?.args[0]).toBe(params.bandHz);
    expect(calls.some((c) => c.method === 'gain.linear' && c.args[0] === params.peakGain)).toBe(
      true,
    );
    const end = ctx.currentTime + params.attack + params.decay;
    expect(calls.find((c) => c.method === 'stop')?.args[0]).toBeCloseTo(end, 5);
  });
});
