import ReactThreeTestRenderer from '@react-three/test-renderer';
import { BufferGeometry, Material, type Object3D } from 'three';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { STOPS } from '../../content/journey';
import { buildRoute } from '../../journey/route';
import { journeyRuntime } from '../../store/journey';
import { CameraAt } from '../../test/CameraAt';
import { PaleBlueDot } from './PaleBlueDot';

const route = buildRoute(STOPS);
const heliopause = route.closePoints.at(-1) ?? 0.8;

afterEach(() => {
  journeyRuntime.position = 0;
  vi.restoreAllMocks();
});

type Renderer = Awaited<ReturnType<typeof ReactThreeTestRenderer.create>>;
const part = (r: Renderer, name: string) =>
  r.scene.instance.getObjectByName(name) as (Object3D & { material: Material }) | undefined;

async function renderAt(p: number) {
  journeyRuntime.position = p;
  const renderer = await ReactThreeTestRenderer.create(
    <>
      <CameraAt z={-p * route.length} />
      <PaleBlueDot route={route} />
    </>,
  );
  await ReactThreeTestRenderer.act(async () => {
    await renderer.advanceFrames(2, 1 / 30);
  });
  return renderer;
}

describe('PaleBlueDot', () => {
  it('draws nothing at the heliopause stop', async () => {
    const renderer = await renderAt(heliopause);
    expect(part(renderer, 'pale-blue-dot')?.visible).toBe(false);
    await renderer.unmount();
  });

  it('draws the dot and its sunbeam in the final view, in the direction of Earth', async () => {
    const renderer = await renderAt(1);
    const group = part(renderer, 'pale-blue-dot');
    expect(group?.visible).toBe(true);
    const dot = part(renderer, 'earth-dot');
    const band = part(renderer, 'sunbeam');
    expect(dot).toBeDefined();
    expect(band).toBeDefined();
    const position = dot?.position.clone().normalize();
    expect(position?.z).toBeGreaterThan(0.99);
    expect(band?.position.distanceTo(dot?.position ?? band.position)).toBeLessThan(1e-6);
    await renderer.unmount();
  });

  it('is additive, writes no depth, and is hidden by nearer objects', async () => {
    const renderer = await renderAt(1);
    for (const name of ['earth-dot', 'sunbeam']) {
      const material = part(renderer, name)?.material;
      expect(material?.depthWrite).toBe(false);
      expect(material?.depthTest).toBe(true);
    }
    await renderer.unmount();
  });

  it('disposes its geometries and materials', async () => {
    const geometrySpy = vi.spyOn(BufferGeometry.prototype, 'dispose');
    const materialSpy = vi.spyOn(Material.prototype, 'dispose');
    const renderer = await renderAt(1);
    const dot = part(renderer, 'earth-dot');
    const band = part(renderer, 'sunbeam');
    await renderer.unmount();
    expect(materialSpy.mock.contexts).toContain(dot?.material);
    expect(materialSpy.mock.contexts).toContain(band?.material);
    expect(geometrySpy).toHaveBeenCalledTimes(2);
  });
});
