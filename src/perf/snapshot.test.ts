import { describe, expect, it } from 'vitest';
import { createSnapshot, recordFrame } from './snapshot';

describe('snapshot', () => {
  it('starts at zero', () => {
    const s = createSnapshot('high');
    expect(s).toMatchObject({
      fps: 0,
      frameMs: 0,
      calls: 0,
      triangles: 0,
      sceneGeometries: 0,
      tier: 'high',
    });
    expect(s.peak).toEqual({ calls: 0, triangles: 0, textureBytes: 0 });
  });

  it('records a frame and keeps the peaks', () => {
    const s = createSnapshot('low');
    recordFrame(s, 40, 1000);
    recordFrame(s, 30, 2000);
    expect(s.calls).toBe(30);
    expect(s.triangles).toBe(2000);
    expect(s.peak.calls).toBe(40);
    expect(s.peak.triangles).toBe(2000);
  });

  it('tracks the texture-bytes peak when the estimate is written', () => {
    const s = createSnapshot('low');
    s.setTextureBytes(500);
    s.setTextureBytes(200);
    expect(s.textureBytes).toBe(200);
    expect(s.peak.textureBytes).toBe(500);
  });

  it('resets the peaks to the current values', () => {
    const s = createSnapshot('low');
    recordFrame(s, 40, 1000);
    recordFrame(s, 10, 100);
    s.setTextureBytes(300);
    s.resetPeaks();
    expect(s.peak).toEqual({ calls: 10, triangles: 100, textureBytes: 300 });
  });
});
