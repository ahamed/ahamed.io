import ReactThreeTestRenderer from '@react-three/test-renderer';
import { useThree } from '@react-three/fiber';
import { createRef, useEffect } from 'react';
import { MathUtils, PerspectiveCamera, Vector3, type Camera, type Group } from 'three';
import { beforeEach, describe, expect, it } from 'vitest';
import { STOPS } from '../content/journey';
import { buildRoute } from '../journey/route';
import { createVoyageContext, createVoyageState, type VoyageState } from '../journey/voyage';
import { createJourneyStore, journeyRuntime } from '../store/journey';
import { plasmaLink } from '../audio/plasmaLink';
import { finaleLayer } from '../ui/Finale/registry';
import { dialogElements, dialogSizes } from '../ui/TerminalDialog/registry';
import { CameraRig } from './CameraRig';
import { FollowCamera } from './space/FollowCamera';

const route = buildRoute(STOPS);
const ctx = createVoyageContext(route, STOPS);
const points = ctx.capture;

/** A voyage resting free (no capture) at progress `p`. */
function placed(p: number): VoyageState {
  const v = createVoyageState(ctx);
  v.mode = 'free';
  v.stop = -1;
  v.position = p;
  return v;
}

/** Hands the R3F default camera to the test. */
function CaptureCamera({ onCamera }: { onCamera: (camera: Camera) => void }) {
  const camera = useThree((s) => s.camera);
  useEffect(() => {
    onCamera(camera);
  }, [camera, onCamera]);
  return null;
}

async function renderRig() {
  const store = createJourneyStore(points, { phase: 'voyage' });
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
  journeyRuntime.captureWeight = 0;
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
    const store = createJourneyStore(points, { phase: 'voyage' });
    const voyage = placed(0);
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
        <CameraRig
          route={route}
          store={store}
          voyager={{ current: null }}
          sky={sky}
          voyage={voyage}
        />
      </>,
    );
    const camera = cameraRef.current;
    const check = async (target: number) => {
      voyage.position = target;
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
    const store = createJourneyStore(points, { phase: 'voyage' });
    // Only a read stop places its card near the body.
    store.getState().markRead('earth');
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
        <CameraRig route={route} store={store} voyager={voyager} voyage={placed(0)} />
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
      const store = createJourneyStore(points, { phase: 'voyage' });
      store.getState().markRead(id);
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
          <CameraRig route={route} store={store} voyager={{ current: null }} voyage={placed(cp)} />
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

describe('CameraRig finale', () => {
  const shipZ = (p: number) => -p * route.length;
  const heliopause = route.closePoints.at(-1) ?? 0.8;

  async function settle(target: number) {
    const store = createJourneyStore(points, { phase: 'voyage' });
    const cameraRef: { current: Camera | null } = { current: null };
    const renderer = await ReactThreeTestRenderer.create(
      <>
        <CaptureCamera
          onCamera={(c) => {
            cameraRef.current = c;
          }}
        />
        <CameraRig
          route={route}
          store={store}
          voyager={{ current: null }}
          voyage={placed(target)}
        />
      </>,
    );
    const frames = async (count: number) => {
      await ReactThreeTestRenderer.act(async () => {
        await renderer.advanceFrames(count, 1 / 30);
      });
    };
    await frames(5);
    if (!cameraRef.current) throw new Error('no camera');
    return { renderer, store, camera: cameraRef.current, frames };
  }

  it('keeps the chase camera behind Voyager at the heliopause stop, with the finale hidden', async () => {
    const { renderer, store, camera } = await settle(heliopause);
    expect(camera.position.z).toBeGreaterThan(shipZ(heliopause));
    expect(store.getState().finaleShown).toBe(false);
    await renderer.unmount();
  });

  it('ends in front of Voyager, facing back toward Earth, with the finale shown', async () => {
    const { renderer, store, camera } = await settle(1);
    expect(camera.position.z).toBeLessThan(shipZ(1));
    expect(camera.getWorldDirection(new Vector3()).z).toBeGreaterThan(0.9);
    expect(store.getState().finaleShown).toBe(true);
    await renderer.unmount();
  });

  it('writes the reveal and the dot position onto the finale layer', async () => {
    const element = document.createElement('div');
    finaleLayer.element = element;
    const { renderer } = await settle(1);
    expect(Number(element.style.getPropertyValue('--reveal'))).toBeCloseTo(1);
    expect(element.dataset.dot).toBe('shown');
    expect(element.style.getPropertyValue('--dot-x')).toMatch(/px$/);
    await renderer.unmount();
    finaleLayer.element = null;
  });

  it('flies a Back to Earth rewind and ends it captured in Earth orbit', async () => {
    const { renderer, store, frames } = await settle(1);
    journeyRuntime.position = 1;
    store.getState().flyBack(performance.now() - 2000, false);
    await frames(1);
    expect(journeyRuntime.position).toBeGreaterThan(0.3);
    expect(journeyRuntime.position).toBeLessThan(0.7);
    store.getState().flyBack(performance.now() - 5000, false);
    await frames(1);
    expect(journeyRuntime.position).toBeCloseTo(points[0] ?? 0);
    expect(store.getState().flight).toBeNull();
    expect(store.getState().orbit).toBe('lap');
    expect(store.getState().capturedStopId).toBe('earth');
    await renderer.unmount();
  });
});

describe('CameraRig boot and intro', () => {
  const earth = route.bodies[0]?.position ?? [0, 0, 0];

  async function rig(phase: 'boot' | 'intro') {
    const store = createJourneyStore(points, { phase, storage: null });
    const cameraRef: { current: Camera | null } = { current: null };
    const renderer = await ReactThreeTestRenderer.create(
      <>
        <CaptureCamera
          onCamera={(c) => {
            cameraRef.current = c;
          }}
        />
        <CameraRig route={route} store={store} voyager={{ current: null }} />
      </>,
    );
    const frames = async (count: number) => {
      await ReactThreeTestRenderer.act(async () => {
        await renderer.advanceFrames(count, 1 / 30);
      });
    };
    await frames(3);
    if (!cameraRef.current) throw new Error('no camera');
    return { renderer, store, camera: cameraRef.current, frames };
  }

  it('holds the wide intro view while booting and opens no dialog', async () => {
    const { renderer, store, camera } = await rig('boot');
    expect(camera.position.y).toBeGreaterThan(8);
    expect(store.getState().openStopId).toBeNull();
    await renderer.unmount();
  });

  it('sweeps into the chase view, then ends the intro and opens Earth', async () => {
    const { renderer, store, camera, frames } = await rig('boot');
    store.setState({ phase: 'intro', introStartAt: performance.now() - 1500 });
    await frames(1);
    expect(camera.position.y).toBeGreaterThan(2.3);
    expect(store.getState().openStopId).toBeNull();
    store.setState({ introStartAt: performance.now() - 5000 });
    await frames(1);
    expect(store.getState().phase).toBe('voyage');
    expect(camera.position.y).toBeCloseTo(2.2, 1);
    await frames(2);
    expect(store.getState().openStopId).toBe('earth');
    expect(store.getState().orbit).toBe('lap');
    // Then it eases out to the orbit view, high above Earth.
    await frames(90);
    expect(camera.position.y).toBeGreaterThan(earth[1] + 10);
    await renderer.unmount();
  });
});

describe('CameraRig plasma level', () => {
  it('is silent at Earth and peaks near the heliopause crossing', async () => {
    const levels: number[] = [];
    plasmaLink.set = (level) => levels.push(level);
    const store = createJourneyStore(points, { phase: 'voyage', storage: null });
    const voyage = placed(0);
    const renderer = await ReactThreeTestRenderer.create(
      <CameraRig route={route} store={store} voyager={{ current: null }} voyage={voyage} />,
    );
    const at = async (p: number) => {
      voyage.position = p;
      await ReactThreeTestRenderer.act(async () => {
        await renderer.advanceFrames(1, 1 / 60);
      });
      return levels.at(-1);
    };
    expect(await at(0)).toBe(0);
    const heliopause = route.closePoints.at(-1) ?? 0.8;
    expect(await at(heliopause)).toBeGreaterThan(0.8);
    plasmaLink.set = () => undefined;
    await renderer.unmount();
  });
});

describe('CameraRig map flight', () => {
  it('flies a map jump to its stop and ends it there', async () => {
    const store = createJourneyStore(points, { phase: 'voyage', storage: null });
    const renderer = await ReactThreeTestRenderer.create(
      <CameraRig route={route} store={store} voyager={{ current: null }} />,
    );
    const saturn = points[14] ?? 0.5;
    store.getState().flyToStop(14, performance.now() - 10_000, false);
    await ReactThreeTestRenderer.act(async () => {
      await renderer.advanceFrames(1, 1 / 60);
    });
    expect(journeyRuntime.position).toBeCloseTo(saturn);
    expect(store.getState().flight).toBeNull();
    expect(store.getState().capturedStopId).toBe('saturn');
    await renderer.unmount();
  });
});

describe('CameraRig read marker', () => {
  it.each([0, 3, 18])(
    'marks stop %i read on its dialog in the frame its lap ends',
    async (index) => {
      const id = STOPS[index]?.id ?? '';
      const element = document.createElement('section');
      element.dataset.read = 'false';
      dialogElements.set(id, element);
      const store = createJourneyStore(points, { phase: 'voyage', storage: null });
      const voyage = createVoyageState(ctx);
      voyage.stop = index;
      voyage.position = points[index] ?? 0;
      voyage.clock = (ctx.lapS[index] ?? 0) * 1000 - 1;
      const renderer = await ReactThreeTestRenderer.create(
        <CameraRig route={route} store={store} voyager={{ current: null }} voyage={voyage} />,
      );
      await ReactThreeTestRenderer.act(async () => {
        await renderer.advanceFrames(1, 1 / 30);
      });
      // The same frame the lap ends: the dialog may close on the next one.
      expect(store.getState().readStops).toContain(id);
      expect(element.dataset.read).toBe('true');
      await renderer.unmount();
      dialogElements.delete(id);
    },
  );
});

describe('CameraRig orbit capture', () => {
  const DIALOG = { w: 416, h: 260 };
  const MOON = 1;

  async function captured() {
    const element = document.createElement('section');
    dialogElements.set('moon', element);
    dialogSizes.set('moon', DIALOG);
    const store = createJourneyStore(points, { phase: 'voyage', storage: null });
    store.getState().markRead('earth');
    const voyage = createVoyageState(ctx);
    voyage.stop = MOON;
    voyage.position = points[MOON] ?? 0;
    voyage.speed = ctx.cruise * 0.1;
    const voyager = createRef<Group>();
    const three = { camera: null as Camera | null, width: 0, height: 0 };
    function Capture() {
      const state = useThree();
      useEffect(() => {
        three.camera = state.camera;
        three.width = state.size.width;
        three.height = state.size.height;
      }, [state]);
      return null;
    }
    const renderer = await ReactThreeTestRenderer.create(
      <>
        <group ref={voyager} />
        <Capture />
        <CameraRig route={route} store={store} voyager={voyager} voyage={voyage} />
      </>,
    );
    const frames = async (count: number, delta = 1 / 30) => {
      await ReactThreeTestRenderer.act(async () => {
        await renderer.advanceFrames(count, delta);
      });
    };
    const done = async () => {
      await renderer.unmount();
      dialogElements.delete('moon');
      dialogSizes.delete('moon');
    };
    return { store, voyage, element, voyager, three, frames, done };
  }

  it('eases into the orbit view, with the body centred beside the docked dialog', async () => {
    const { element, voyager, three, frames, done } = await captured();
    await frames(90);
    expect(element.dataset.orbit).toBe('lap');
    expect(element.dataset.read).toBe('false');
    const camera = three.camera as PerspectiveCamera;
    const body = route.bodies[MOON];
    if (!body) throw new Error('no moon');
    // Looking down on the lap from above.
    expect(camera.position.y).toBeGreaterThan(body.position[1] + 3);
    // The view offset centres the body in the space right of the dock.
    const centre = new Vector3(...body.position).project(camera);
    const cx = ((centre.x + 1) / 2) * three.width;
    const dock = DIALOG.w + 32;
    // The body's screen disc is published for E2E as "x,y,r".
    const [bx = 0, , br = 0] = (element.dataset.bodyRect ?? '').split(',').map(Number);
    expect(Math.abs(bx - cx)).toBeLessThan(2);
    expect(br).toBeGreaterThan(0);
    expect(Math.abs(cx - (dock + (three.width - dock) / 2))).toBeLessThan(three.width * 0.05);
    // The dialog sits at the left margin at full scale.
    expect(Number.parseFloat(element.style.getPropertyValue('--x'))).toBeCloseTo(16, -1);
    expect(Number(element.style.getPropertyValue('--scale'))).toBeCloseTo(1, 1);
    // Voyager has left the route line onto the lap.
    expect(Math.abs(voyager.current?.position.x ?? 0)).toBeGreaterThan(0.1);
    // The HUD reads a held position and no speed for the whole lap.
    expect(journeyRuntime.position).toBe(points[MOON]);
    expect(journeyRuntime.speed).toBe(0);
    await done();
  });

  it('marks the stop read when the lap ends, coasts, and returns to the chase view', async () => {
    const { store, element, three, frames, done } = await captured();
    await frames(Math.ceil((ctx.lapS[MOON] ?? 0) * 30) + 3);
    expect(store.getState().readStops).toContain('moon');
    expect(store.getState().orbit).toBe('coast');
    expect(element.dataset.read).toBe('true');
    await frames(150);
    const camera = three.camera as PerspectiveCamera;
    expect(camera.view?.enabled ?? false).toBe(false);
    // Back in the chase view, aimed at the next lap target.
    const mars = route.bodies[MOON + 1];
    if (!mars) throw new Error('no mars');
    const at = new Vector3(...mars.position).project(camera);
    expect(Math.abs(at.x)).toBeLessThan(0.005);
    await done();
  });
});

describe('CameraRig approach', () => {
  const DIALOG = { w: 416, h: 260 };
  const MOON = 1;

  /** A free voyage at `p` moving forward, with the given stops read. */
  async function approaching(p: number, read: string[], stops: string[]) {
    const elements = stops.map((id) => {
      const element = document.createElement('section');
      dialogElements.set(id, element);
      dialogSizes.set(id, DIALOG);
      return element;
    });
    const store = createJourneyStore(points, { phase: 'voyage', storage: null });
    for (const id of read) store.getState().markRead(id);
    const voyage = placed(p);
    const voyager = createRef<Group>();
    const three = { camera: null as Camera | null, width: 0, height: 0 };
    function Capture() {
      const state = useThree();
      useEffect(() => {
        three.camera = state.camera;
        three.width = state.size.width;
        three.height = state.size.height;
      }, [state]);
      return null;
    }
    const renderer = await ReactThreeTestRenderer.create(
      <>
        <group ref={voyager} />
        <Capture />
        <CameraRig route={route} store={store} voyager={voyager} voyage={voyage} />
      </>,
    );
    const frames = async (count: number, delta = 1 / 60) => {
      await ReactThreeTestRenderer.act(async () => {
        await renderer.advanceFrames(count, delta);
      });
    };
    const screenX = (i: number) => {
      const body = route.bodies[i];
      const camera = three.camera;
      if (!body || !camera) return NaN;
      const v = new Vector3(...body.position).project(camera);
      return ((v.x + 1) / 2) * three.width;
    };
    const screenY = (i: number) => {
      const body = route.bodies[i];
      const camera = three.camera;
      if (!body || !camera) return NaN;
      const v = new Vector3(...body.position).project(camera);
      return ((1 - v.y) / 2) * three.height;
    };
    const done = async () => {
      await renderer.unmount();
      for (const id of stops) {
        dialogElements.delete(id);
        dialogSizes.delete(id);
      }
    };
    return { store, voyage, elements, three, frames, screenX, screenY, done };
  }

  it('centres the lap target from afar', async () => {
    const JUPITER = ctx.ids.indexOf('jupiter');
    const from = points[JUPITER - 1] ?? 0;
    const to = points[JUPITER] ?? 0;
    const r = await approaching(from + (to - from) * 0.5, ctx.ids.slice(0, JUPITER), []);
    await r.frames(120);
    // Halfway along the leg, still in the chase view: Jupiter is at the screen centre.
    expect(Math.abs(r.screenX(JUPITER) - r.three.width / 2)).toBeLessThan(r.three.width * 0.01);
    await r.done();
  });

  it('has the target centred beside the dock at capture, with no swing across it', async () => {
    const cp = points[MOON] ?? 0;
    const r = await approaching(cp - (cp - (points[0] ?? 0)) * 0.6, ['earth'], ['moon']);
    r.voyage.speed = ctx.cruise;
    r.store.setState({ heldKey: 1 });
    await r.frames(2);
    let prev = r.screenX(MOON);
    let atCapture = NaN;
    for (let i = 0; i < 900 && Number.isNaN(atCapture); i++) {
      await r.frames(1);
      const x = r.screenX(MOON);
      expect(Math.abs(x - prev)).toBeLessThan(r.three.width * 0.02);
      prev = x;
      if (r.voyage.mode === 'captured') {
        atCapture = x;
        expect(Math.abs(r.screenY(MOON) - r.three.height / 2)).toBeLessThan(r.three.height * 0.05);
      }
    }
    const dock = DIALOG.w + 32;
    const centre = dock + (r.three.width - dock) / 2;
    expect(Math.abs(atCapture - centre)).toBeLessThan(r.three.width * 0.05);
    // And it stays there through the first second of the lap: no swing after capture.
    for (let i = 0; i < 60; i++) {
      await r.frames(1);
      expect(Math.abs(r.screenX(MOON) - centre)).toBeLessThan(r.three.width * 0.05);
      expect(Math.abs(r.screenY(MOON) - r.three.height / 2)).toBeLessThan(r.three.height * 0.05);
    }
    await r.done();
  });

  it('opens no card for an unread stop on the approach', async () => {
    const cp = points[MOON] ?? 0;
    const r = await approaching(cp - 0.0005, ['earth'], ['moon']);
    await r.frames(30);
    expect(r.store.getState().openStopId).toBeNull();
    await r.done();
  });

  it('writes a captured card at the dock from its first frame and fades it in', async () => {
    const cp = points[MOON] ?? 0;
    const r = await approaching(cp - 1e-5, ['earth'], ['moon']);
    r.voyage.speed = ctx.cruise * 0.05;
    const [element] = r.elements;
    if (!element) throw new Error('no element');
    let first = true;
    for (let i = 0; i < 60; i++) {
      await r.frames(1);
      if (r.store.getState().openStopId !== 'moon') continue;
      const x = Number.parseFloat(element.style.getPropertyValue('--x'));
      expect(x).toBeCloseTo(16, 0);
      if (first) {
        expect(Number(element.style.getPropertyValue('--opacity'))).toBeLessThan(0.5);
        first = false;
      }
    }
    expect(first).toBe(false);
    expect(Number(element.style.getPropertyValue('--opacity'))).toBeCloseTo(1, 2);
    await r.done();
  });
});
