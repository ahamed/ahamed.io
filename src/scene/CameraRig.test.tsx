import ReactThreeTestRenderer from '@react-three/test-renderer';
import { useThree } from '@react-three/fiber';
import { createRef, useEffect } from 'react';
import { MathUtils, PerspectiveCamera, Vector3, type Camera, type Group } from 'three';
import { beforeEach, describe, expect, it } from 'vitest';
import { STOPS } from '../content/journey';
import { buildRoute } from '../journey/route';
import { createJourneyStore, journeyRuntime } from '../store/journey';
import { dialogElements, dialogSizes } from '../ui/TerminalDialog/registry';
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

describe('CameraRig dialog placement', () => {
  const DIALOG = { w: 360, h: 220 };
  const px = (element: HTMLElement, name: string) =>
    Number.parseFloat(element.style.getPropertyValue(name));

  async function renderWithDialog() {
    const element = document.createElement('section');
    dialogElements.set('earth', element);
    dialogSizes.set('earth', DIALOG);
    const store = createJourneyStore(route.closePoints);
    const voyager = createRef<Group>();
    const size = { width: 0, height: 0 };
    function CaptureSize() {
      const current = useThree((s) => s.size);
      useEffect(() => {
        size.width = current.width;
        size.height = current.height;
      }, [current]);
      return null;
    }
    const renderer = await ReactThreeTestRenderer.create(
      <>
        <group ref={voyager}>
          <mesh>
            <boxGeometry args={[2, 1, 1]} />
          </mesh>
        </group>
        <CaptureSize />
        <CameraRig route={route} store={store} voyager={voyager} />
      </>,
    );
    await ReactThreeTestRenderer.act(async () => {
      await renderer.advanceFrames(5, 1 / 60);
    });
    return { renderer, element, size: () => size };
  }

  it('writes a spot, a top-left position and Voyager’s screen rect for the open dialog', async () => {
    const { renderer, element, size } = await renderWithDialog();
    expect(['left', 'right', 'above', 'below']).toContain(element.dataset.spot);
    const [vx, vy, vw, vh] = (element.dataset.voyagerRect ?? '').split(',').map(Number);
    expect(vw).toBeGreaterThan(0);
    expect(vh).toBeGreaterThan(0);
    // The 2×1×1 test ship projects as its box, wider than tall (not as a round bounding sphere).
    expect((vw ?? 0) / (vh ?? 1)).toBeGreaterThan(1.3);
    const x = px(element, '--x');
    const y = px(element, '--y');
    const scale = px(element, '--scale');
    const w = DIALOG.w * scale;
    const h = DIALOG.h * scale;
    const clear =
      x + w <= (vx ?? 0) ||
      (vx ?? 0) + (vw ?? 0) <= x ||
      y + h <= (vy ?? 0) ||
      (vy ?? 0) + (vh ?? 0) <= y;
    expect(clear).toBe(true);
    expect(x).toBeGreaterThanOrEqual(0);
    expect(x + w).toBeLessThanOrEqual(size().width);
    await renderer.unmount();
    dialogElements.delete('earth');
    dialogSizes.delete('earth');
  });
});

describe('CameraRig dialog placement beside a giant', () => {
  const DIALOG = { w: 416, h: 180 };
  const px = (element: HTMLElement, name: string) =>
    Number.parseFloat(element.style.getPropertyValue(name));

  it.each(['jupiter', 'saturn'])(
    'keeps the %s dialog off the planet (and rings) at its stop',
    async (id) => {
      const index = route.bodies.findIndex((b) => b.id === id);
      const body = route.bodies[index];
      const cp = route.closePoints[index] ?? 0;
      if (!body) throw new Error(id);
      const element = document.createElement('section');
      dialogElements.set(id, element);
      dialogSizes.set(id, DIALOG);
      journeyRuntime.position = cp;
      const store = createJourneyStore(route.closePoints);
      store.getState().snapTo(cp);
      const state = { camera: null as Camera | null, width: 0, height: 0 };
      function Capture() {
        const three = useThree();
        useEffect(() => {
          state.camera = three.camera;
          state.width = three.size.width;
          state.height = three.size.height;
        }, [three]);
        return null;
      }
      const renderer = await ReactThreeTestRenderer.create(
        <>
          <Capture />
          <CameraRig route={route} store={store} voyager={{ current: null }} />
        </>,
      );
      await ReactThreeTestRenderer.act(async () => {
        await renderer.advanceFrames(5, 1 / 60);
      });
      const camera = state.camera as PerspectiveCamera;
      const centre = new Vector3(...body.position);
      const distance = centre.distanceTo(camera.position);
      centre.project(camera);
      const cx = ((centre.x + 1) / 2) * state.width;
      const cy = ((1 - centre.y) / 2) * state.height;
      const r =
        (body.footprint * state.height) /
        (2 * Math.tan(MathUtils.degToRad(camera.fov) / 2) * distance);
      const scale = px(element, '--scale');
      const x = px(element, '--x');
      const y = px(element, '--y');
      const nx = Math.max(x, Math.min(cx, x + DIALOG.w * scale));
      const ny = Math.max(y, Math.min(cy, y + DIALOG.h * scale));
      expect(Math.hypot(nx - cx, ny - cy), element.dataset.spot).toBeGreaterThanOrEqual(r * 0.97);
      await renderer.unmount();
      dialogElements.delete(id);
      dialogSizes.delete(id);
    },
  );
});
