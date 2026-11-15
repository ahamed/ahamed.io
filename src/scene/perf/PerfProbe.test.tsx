import { useThree } from '@react-three/fiber';
import ReactThreeTestRenderer from '@react-three/test-renderer';
import { useEffect } from 'react';
import type { WebGLRenderer } from 'three';
import { afterEach, describe, expect, it } from 'vitest';
import { createSnapshot } from '../../perf/snapshot';
import { createQualityStore } from '../quality/store';
import { PerfProbe } from './PerfProbe';

afterEach(() => {
  delete window.__voyagePerf;
});

let captured: WebGLRenderer | null = null;
function CaptureGl() {
  const gl = useThree((s) => s.gl);
  useEffect(() => {
    captured = gl;
  }, [gl]);
  return null;
}

const quality = () => createQualityStore({ forced: 'low', handheld: false, cores: 8 });

describe('PerfProbe', () => {
  it('exposes the snapshot, turns off info.autoReset, and restores both on unmount', async () => {
    const snapshot = createSnapshot('high');
    const renderer = await ReactThreeTestRenderer.create(
      <>
        <CaptureGl />
        <PerfProbe snapshot={snapshot} store={quality()} />
      </>,
    );
    expect(window.__voyagePerf).toBe(snapshot);
    expect(captured?.info.autoReset).toBe(false);
    await renderer.unmount();
    expect(window.__voyagePerf).toBeUndefined();
    expect(captured?.info.autoReset).toBe(true);
  });

  it('measures the frame rate and follows the quality tier', async () => {
    const snapshot = createSnapshot('high');
    const renderer = await ReactThreeTestRenderer.create(
      <PerfProbe snapshot={snapshot} store={quality()} />,
    );
    await ReactThreeTestRenderer.act(async () => {
      await renderer.advanceFrames(30, 1 / 30);
    });
    expect(snapshot.fps).toBeCloseTo(30, 0);
    expect(snapshot.tier).toBe('low');
    await renderer.unmount();
  });
});
