import { describe, expect, it } from 'vitest';
import { isPerf } from './perf';

describe('isPerf', () => {
  it('is on for ?perf, alone or with other parameters', () => {
    expect(isPerf('?perf')).toBe(true);
    expect(isPerf('?quality=low&perf')).toBe(true);
    expect(isPerf('?perf=1')).toBe(true);
  });

  it('is off otherwise', () => {
    expect(isPerf('')).toBe(false);
    expect(isPerf('?performance')).toBe(false);
  });
});
