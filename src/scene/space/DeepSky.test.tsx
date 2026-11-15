import { useThree } from '@react-three/fiber';
import ReactThreeTestRenderer from '@react-three/test-renderer';
import { useLayoutEffect } from 'react';
import { BufferGeometry, Material, type Mesh, type Points, type ShaderMaterial } from 'three';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { STOPS } from '../../content/journey';
import { buildRoute } from '../../journey/route';
import { CameraAt } from '../../test/CameraAt';
import { DeepSky } from './DeepSky';
import { GALAXIES, NEBULAE } from './deepSkyField';
import { heliopauseLayout } from './heliosphere';

afterEach(() => {
  vi.restoreAllMocks();
});

const route = buildRoute(STOPS);
const layout = heliopauseLayout(route);
const zEris = -(route.closePoints[STOPS.findIndex((s) => s.id === 'eris')] ?? 0) * route.length;

/** The renderer's canvas, captured so tests can read the state DeepSky marks on it. */
const probe: { canvas?: HTMLElement } = {};
function CanvasProbe() {
  const element = useThree((s) => s.gl.domElement);
  useLayoutEffect(() => {
    probe.canvas = element;
  }, [element]);
  return null;
}

async function at(z: number) {
  const renderer = await ReactThreeTestRenderer.create(
    <>
      <CanvasProbe />
      <CameraAt z={z} />
      <DeepSky route={route} />
    </>,
  );
  await ReactThreeTestRenderer.act(async () => {
    await renderer.advanceFrames(2, 1 / 30);
  });
  return renderer;
}

type Renderer = Awaited<ReturnType<typeof at>>;
const object = (r: Renderer, name: string) => {
  const found = r.scene.instance.getObjectByName(name);
  if (!found) throw new Error(`missing ${name}`);
  return found;
};
const fade = (o: Mesh | Points) => (o.material as ShaderMaterial).uniforms.uFade?.value as number;

describe('DeepSky', () => {
  it('draws one nebula mesh (three clouds) and one merged galaxy point cloud', async () => {
    const renderer = await at(layout.zStop);
    const nebula = object(renderer, 'nebula') as Mesh;
    const galaxies = object(renderer, 'galaxies') as Points;
    expect(nebula.geometry.getIndex()?.count).toBe(NEBULAE.length * 6);
    expect(galaxies.geometry.getAttribute('position').count).toBe(
      GALAXIES.reduce((n, g) => n + g.options.count, 0),
    );
    expect(object(renderer, 'deep-sky').children).toHaveLength(2);
    await renderer.unmount();
  });

  it('is hidden in the Solar System, at Eris and before', async () => {
    const renderer = await at(zEris);
    expect(object(renderer, 'deep-sky').visible).toBe(false);
    expect(probe.canvas?.dataset.deepSky).toBe('hidden');
    await renderer.unmount();
  });

  it('is fully faded in at the heliopause stop', async () => {
    const renderer = await at(layout.zStop);
    expect(object(renderer, 'deep-sky').visible).toBe(true);
    expect(probe.canvas?.dataset.deepSky).toBe('shown');
    expect(fade(object(renderer, 'nebula') as Mesh)).toBe(1);
    expect(fade(object(renderer, 'galaxies') as Points)).toBe(1);
    await renderer.unmount();
  });

  it('disposes the geometries and materials it creates', async () => {
    const geometrySpy = vi.spyOn(BufferGeometry.prototype, 'dispose');
    const materialSpy = vi.spyOn(Material.prototype, 'dispose');
    const renderer = await at(layout.zStop);
    const parts = [object(renderer, 'nebula') as Mesh, object(renderer, 'galaxies') as Points];
    await renderer.unmount();
    for (const part of parts) {
      expect(geometrySpy.mock.contexts).toContain(part.geometry);
      expect(materialSpy.mock.contexts).toContain(part.material);
    }
  });
});

describe('DeepSky quality', () => {
  it('thins every galaxy evenly at the low tier', async () => {
    const renderer = await ReactThreeTestRenderer.create(
      <>
        <CameraAt z={layout.zStop} />
        <DeepSky route={route} tier="low" />
      </>,
    );
    const galaxies = renderer.scene.instance.getObjectByName('galaxies') as Points;
    const total = GALAXIES.reduce((n, g) => n + g.options.count, 0);
    expect(galaxies.geometry.drawRange.count).toBe(Math.round(total * 0.5));
    await renderer.unmount();
  });
});
