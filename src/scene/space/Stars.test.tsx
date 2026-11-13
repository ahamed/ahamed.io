import ReactThreeTestRenderer from '@react-three/test-renderer';
import { BufferGeometry, Material, Points, ShaderMaterial } from 'three';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { stubReducedMotion } from '../../test/reducedMotion';
import { Stars, STAR_COUNT } from './Stars';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

async function renderStars() {
  const renderer = await ReactThreeTestRenderer.create(<Stars />);
  const points = renderer.scene.instance.getObjectByName('stars');
  if (!(points instanceof Points)) throw new Error('no star points');
  const material = (points as Points).material as ShaderMaterial;
  const time = () => material.uniforms.uTime?.value as number;
  return { renderer, points: points as Points, material, time };
}

const advance = async (renderer: Awaited<ReturnType<typeof ReactThreeTestRenderer.create>>) => {
  await ReactThreeTestRenderer.act(async () => {
    await renderer.advanceFrames(20, 1 / 20);
  });
};

describe('Stars', () => {
  it('draws every star as one Points object that is never culled', async () => {
    stubReducedMotion(false);
    const { renderer, points, material } = await renderStars();
    expect(STAR_COUNT).toBeGreaterThanOrEqual(3000);
    expect(points.geometry.getAttribute('position').count).toBe(STAR_COUNT);
    for (const name of ['size', 'aColor', 'phase']) {
      expect(points.geometry.getAttribute(name).count).toBe(STAR_COUNT);
    }
    expect(material).toBeInstanceOf(ShaderMaterial);
    expect(material.depthWrite).toBe(false);
    expect(points.frustumCulled).toBe(false);
    expect(points.renderOrder).toBeLessThan(0);
    await renderer.unmount();
  });

  it('twinkles over time', async () => {
    stubReducedMotion(false);
    const { renderer, time } = await renderStars();
    const before = time();
    await advance(renderer);
    expect(time()).toBeGreaterThan(before);
    await renderer.unmount();
  });

  it('holds still under reduced motion', async () => {
    stubReducedMotion(true);
    const { renderer, time } = await renderStars();
    const before = time();
    await advance(renderer);
    expect(time()).toBe(before);
    await renderer.unmount();
  });

  it('disposes its geometry and material on unmount', async () => {
    stubReducedMotion(false);
    const geometrySpy = vi.spyOn(BufferGeometry.prototype, 'dispose');
    const materialSpy = vi.spyOn(Material.prototype, 'dispose');
    const { renderer, points, material } = await renderStars();
    await renderer.unmount();
    expect(geometrySpy.mock.contexts).toContain(points.geometry);
    expect(materialSpy.mock.contexts).toContain(material);
  });
});
