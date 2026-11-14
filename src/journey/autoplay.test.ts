import { describe, expect, it } from 'vitest';
import { REVEAL_CPS } from '../ui/TerminalDialog/typewriter';
import { autoplayNext, dwellMs, MIN_DWELL_MS } from './autoplay';

describe('dwellMs', () => {
  it('waits for the typewriter, then the reading time at 200 words a minute', () => {
    const text = Array.from({ length: 100 }, () => 'word').join(' ');
    const typing = (text.length / REVEAL_CPS) * 1000;
    expect(dwellMs(text)).toBeCloseTo(typing + 30_000);
  });

  it('never reads for less than 4 seconds', () => {
    expect(MIN_DWELL_MS).toBe(4000);
    const text = 'Two words';
    expect(dwellMs(text)).toBeCloseTo((text.length / REVEAL_CPS) * 1000 + 4000);
  });
});

describe('autoplayNext', () => {
  const closePoints = [0, 0.3, 0.8];

  it('goes to the next stop, from a stop or from between stops', () => {
    expect(autoplayNext(0, closePoints)).toBe(0.3);
    expect(autoplayNext(0.1, closePoints)).toBe(0.3);
    expect(autoplayNext(0.3, closePoints)).toBe(0.8);
  });

  it('goes to the end of the route after the last stop, and nowhere from the end', () => {
    expect(autoplayNext(0.8, closePoints)).toBe(1);
    expect(autoplayNext(0.95, closePoints)).toBe(1);
    expect(autoplayNext(1, closePoints)).toBeNull();
  });
});
