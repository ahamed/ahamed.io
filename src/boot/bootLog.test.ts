import { describe, expect, it } from 'vitest';
import { bootLines, isSettled, nextPercent, QUIET_MS, type BootState } from './bootLog';

const state = (over: Partial<BootState> = {}): BootState => ({
  chunk: false,
  loaded: 0,
  total: 0,
  settled: false,
  ...over,
});

describe('bootLines', () => {
  it('starts with the header and the pending flight software line', () => {
    const lines = bootLines(state());
    expect(lines.map((l) => l.text)).toEqual([
      'VOYAGER 1 · FLIGHT DATA SUBSYSTEM',
      'loading flight software …',
    ]);
    expect(lines[1]?.done).toBe(false);
  });

  it('counts textures once the scene code is in', () => {
    const lines = bootLines(state({ chunk: true, loaded: 12, total: 21 }));
    expect(lines.map((l) => l.text)).toEqual([
      'VOYAGER 1 · FLIGHT DATA SUBSYSTEM',
      'loading flight software … ok',
      'calibrating imaging … 12/21',
    ]);
  });

  it('reports the telemetry link once loading has settled', () => {
    const lines = bootLines(state({ chunk: true, loaded: 21, total: 21, settled: true }));
    expect(lines.at(-2)?.text).toBe('calibrating imaging … 21/21 ok');
    expect(lines.at(-1)).toEqual({ text: 'telemetry link … ok', done: true });
  });
});

describe('nextPercent', () => {
  it('rises with the scene code and the loaded share, and is 100 only when settled', () => {
    expect(nextPercent(0, state())).toBe(0);
    const chunk = nextPercent(0, state({ chunk: true }));
    expect(chunk).toBeGreaterThan(0);
    const half = nextPercent(chunk, state({ chunk: true, loaded: 5, total: 10 }));
    expect(half).toBeGreaterThan(chunk);
    expect(nextPercent(half, state({ chunk: true, loaded: 10, total: 10 }))).toBeLessThan(100);
    expect(nextPercent(half, state({ chunk: true, loaded: 10, total: 10, settled: true }))).toBe(
      100,
    );
  });

  it('never goes down when more items are discovered', () => {
    const before = nextPercent(0, state({ chunk: true, loaded: 9, total: 10 }));
    expect(nextPercent(before, state({ chunk: true, loaded: 9, total: 20 }))).toBe(before);
  });
});

describe('isSettled', () => {
  it('needs the scene code, every item loaded and a quiet spell', () => {
    expect(isSettled(state({ loaded: 3, total: 3 }), QUIET_MS)).toBe(false);
    expect(isSettled(state({ chunk: true, loaded: 2, total: 3 }), QUIET_MS)).toBe(false);
    expect(isSettled(state({ chunk: true, loaded: 3, total: 3 }), QUIET_MS - 1)).toBe(false);
    expect(isSettled(state({ chunk: true, loaded: 3, total: 3 }), QUIET_MS)).toBe(true);
  });

  it('waits for loading to start at all', () => {
    expect(isSettled(state({ chunk: true }), QUIET_MS)).toBe(false);
  });
});
