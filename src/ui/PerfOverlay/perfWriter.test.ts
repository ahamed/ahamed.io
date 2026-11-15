import { describe, expect, it } from 'vitest';
import { createSnapshot } from '../../perf/snapshot';
import { createPerfWriter, PERF_ROWS, type PerfRow } from './perfWriter';

function targets() {
  return Object.fromEntries(PERF_ROWS.map((row) => [row, document.createElement('dd')])) as Record<
    PerfRow,
    HTMLElement
  >;
}

describe('createPerfWriter', () => {
  it('writes every value, rounded for reading', () => {
    const dd = targets();
    const s = createSnapshot('medium');
    Object.assign(s, {
      fps: 59.64,
      frameMs: 16.77,
      calls: 42,
      triangles: 123_456,
      geometries: 30,
      textures: 18,
      textureBytes: 12.34 * 1024 * 1024,
    });
    createPerfWriter(dd)(s);
    expect(dd.fps.textContent).toBe('59.6');
    expect(dd.frame.textContent).toBe('16.8 ms');
    expect(dd.calls.textContent).toBe('42');
    expect(dd.triangles.textContent).toBe('123,456');
    expect(dd.geometries.textContent).toBe('30');
    expect(dd.textures.textContent).toBe('18');
    expect(dd.textureMb.textContent).toBe('12.3 MB');
    expect(dd.tier.textContent).toBe('medium');
  });

  it('marks values over the tier budget, with a hidden label, and clears the mark after', () => {
    const dd = targets();
    const write = createPerfWriter(dd);
    const s = createSnapshot('low');
    s.calls = 51;
    write(s);
    expect(dd.calls.hasAttribute('data-over')).toBe(true);
    expect(dd.calls.textContent).toBe('51 over budget');
    expect(dd.calls.querySelector('.visually-hidden')?.textContent).toBe(' over budget');
    expect(dd.triangles.hasAttribute('data-over')).toBe(false);
    s.calls = 10;
    write(s);
    expect(dd.calls.hasAttribute('data-over')).toBe(false);
    expect(dd.calls.textContent).toBe('10');
  });

  it('writes dashes before the probe has started', () => {
    const dd = targets();
    createPerfWriter(dd)(undefined);
    expect(dd.fps.textContent).toBe('–');
    expect(dd.tier.textContent).toBe('–');
  });
});
