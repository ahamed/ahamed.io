import ReactThreeTestRenderer from '@react-three/test-renderer';
import { useThree } from '@react-three/fiber';
import { createRef, useEffect } from 'react';
import type { Camera, Group } from 'three';
import { beforeEach, describe, expect, it } from 'vitest';
import { STOPS } from '../content/journey';
import { buildRoute } from '../journey/route';
import { createJourneyStore, journeyRuntime } from '../store/journey';
import { CameraRig } from './CameraRig';
import { FollowCamera } from './space/FollowCamera';

const route = buildRoute(STOPS);

/** Hands the R3F default camera to the test. */
function CaptureCamera({ onCamera }: { onCamera: (camera: Camera) => void }) {
  const camera = useThree((s) => s.camera);
  useEffect(() => {
    onCamera(camera);
  }, [camera, onCamera]);
  return null;
}

async function renderRig() {
  const store = createJourneyStore(route.closePoints);
  const renderer = await ReactThreeTestRenderer.create(
    <CameraRig route={route} store={store} voyager={{ current: null }} />,
  );
  const frames = async (count: number, delta: number) => {
    await ReactThreeTestRenderer.act(async () => {
      await renderer.advanceFrames(count, delta);
    });
  };
  return { renderer, store, frames };
}

beforeEach(() => {
  journeyRuntime.position = 0;
  journeyRuntime.speed = 0;
});

describe('CameraRig travel speed', () => {
  it('is zero while the voyage is at rest', async () => {
    const { renderer, frames } = await renderRig();
    await frames(10, 1 / 60);
    expect(journeyRuntime.speed).toBe(0);
    await renderer.unmount();
  });

  it('reports the eased progress per second while travelling', async () => {
    const { renderer, store, frames } = await renderRig();
    store.getState().goToStop(1, performance.now());
    await frames(5, 1 / 60);
    expect(journeyRuntime.speed).toBeGreaterThan(0);
    await renderer.unmount();
  });

  it('is zero for a frame with no elapsed time', async () => {
    const { renderer, store, frames } = await renderRig();
    store.getState().goToStop(1, performance.now());
    await frames(5, 1 / 60);
    await frames(1, 0);
    expect(journeyRuntime.speed).toBe(0);
    await renderer.unmount();
  });
});

describe('CameraRig sky follow', () => {
  it('keeps the sky group on the camera at every progress, so the sky shows no parallax', async () => {
    const store = createJourneyStore(route.closePoints);
    const sky = createRef<Group>();
    const cameraRef: { current: Camera | null } = { current: null };
    const renderer = await ReactThreeTestRenderer.create(
      <>
        <group ref={sky} />
        <CaptureCamera
          onCamera={(c) => {
            cameraRef.current = c;
          }}
        />
        <CameraRig route={route} store={store} voyager={{ current: null }} sky={sky} />
      </>,
    );
    const camera = cameraRef.current;
    const check = async (target: number) => {
      store.getState().snapTo(target);
      await ReactThreeTestRenderer.act(async () => {
        await renderer.advanceFrames(240, 1 / 30);
      });
      if (!sky.current || !camera) throw new Error('no sky or camera');
      expect(sky.current.position.distanceTo(camera.position)).toBeLessThan(1e-9);
    };
    await check(0);
    const atStart = sky.current?.position.clone();
    await check(route.closePoints[1] ?? 0.5);
    expect(sky.current?.position.z).toBeLessThan(atStart?.z ?? 0);
    await renderer.unmount();
  });
});

describe('FollowCamera', () => {
  it('copies the camera position into its target every frame', async () => {
    const target = createRef<Group>();
    const cameraRef: { current: Camera | null } = { current: null };
    const renderer = await ReactThreeTestRenderer.create(
      <>
        <group ref={target} />
        <CaptureCamera
          onCamera={(c) => {
            cameraRef.current = c;
          }}
        />
        <FollowCamera target={target} />
      </>,
    );
    const camera = cameraRef.current;
    camera?.position.set(3, -2, 40);
    await ReactThreeTestRenderer.act(async () => {
      await renderer.advanceFrames(1, 1 / 60);
    });
    expect(target.current?.position.toArray()).toEqual([3, -2, 40]);
    await renderer.unmount();
  });
});
