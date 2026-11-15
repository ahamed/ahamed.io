import ReactThreeTestRenderer from '@react-three/test-renderer';
import { useThree } from '@react-three/fiber';
import { useEffect } from 'react';
import { describe, expect, it } from 'vitest';
import { createJourneyStore } from '../../store/journey';
import { frameBounds, isMeasuring } from './adapt';
import { QualityMonitor } from './QualityMonitor';
import { createQualityStore } from './store';

function CaptureCanvas({ onCanvas }: { onCanvas: (canvas: HTMLCanvasElement) => void }) {
  const gl = useThree((s) => s.gl);
  useEffect(() => {
    onCanvas(gl.domElement);
  }, [gl, onCanvas]);
  return null;
}

async function setup(forced: 'low' | null = null) {
  const quality = createQualityStore({ forced, handheld: false, cores: 8 });
  const journey = createJourneyStore([0, 0.8], { storage: null });
  let canvas: HTMLCanvasElement | undefined;
  const renderer = await ReactThreeTestRenderer.create(
    <>
      <CaptureCanvas
        onCanvas={(c) => {
          canvas = c;
        }}
      />
      <QualityMonitor store={quality} journey={journey} />
    </>,
  );
  if (!canvas) throw new Error('no canvas');
  return { quality, journey, renderer, canvas };
}

describe('QualityMonitor', () => {
  it('marks the canvas with the current tier and follows changes', async () => {
    const { quality, renderer, canvas } = await setup();
    expect(canvas.dataset.quality).toBe('high');
    await ReactThreeTestRenderer.act(async () => {
      quality.getState().step('down');
      await Promise.resolve();
    });
    expect(canvas.dataset.quality).toBe('medium');
    await renderer.unmount();
  });

  it('measures only after the boot panel, and never for a forced tier', () => {
    expect(isMeasuring('boot', false)).toBe(false);
    expect(isMeasuring('intro', false)).toBe(true);
    expect(isMeasuring('voyage', false)).toBe(true);
    expect(isMeasuring('voyage', true)).toBe(false);
  });

  it('bounds the frame rate at 45 fps on desktop and 30 on handhelds', () => {
    expect(frameBounds(false)(60)).toEqual([45, 54]);
    expect(frameBounds(false)(144)[1]).toBe(81);
    expect(frameBounds(true)(60)).toEqual([30, 55]);
  });
});
