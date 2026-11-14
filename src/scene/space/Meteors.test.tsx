import ReactThreeTestRenderer from '@react-three/test-renderer';
import { BufferGeometry, Material, type Mesh } from 'three';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { stubReducedMotion } from '../../test/reducedMotion';
import { SKY_ORDER } from './layout';
import { Meteors } from './Meteors';

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

type Renderer = Awaited<ReturnType<typeof ReactThreeTestRenderer.create>>;
const meteor = (r: Renderer) => r.scene.instance.getObjectByName('meteor') as Mesh | undefined;

describe('Meteors', () => {
  it('draws one additive streak behind the bodies, between the stars and the Sun', async () => {
    stubReducedMotion(false);
    const renderer = await ReactThreeTestRenderer.create(<Meteors />);
    const mesh = meteor(renderer);
    expect(mesh).toBeDefined();
    expect(mesh?.renderOrder).toBeGreaterThan(SKY_ORDER.stars);
    expect(mesh?.renderOrder).toBeLessThan(SKY_ORDER.sun);
    const material = mesh?.material as Material;
    expect(material.depthTest).toBe(false);
    expect(material.depthWrite).toBe(false);
    await renderer.unmount();
  });

  it('shows a streak only while a meteor is active', async () => {
    stubReducedMotion(false);
    const renderer = await ReactThreeTestRenderer.create(<Meteors />);
    await ReactThreeTestRenderer.act(async () => {
      await renderer.advanceFrames(2, 1 / 30);
    });
    expect(meteor(renderer)?.visible).toBe(false);
    let seen = false;
    for (let i = 0; i < 160 && !seen; i++) {
      await ReactThreeTestRenderer.act(async () => {
        await renderer.advanceFrames(1, 0.1);
      });
      seen = meteor(renderer)?.visible ?? false;
    }
    expect(seen).toBe(true);
    await renderer.unmount();
  });

  it('draws no meteors under reduced motion', async () => {
    stubReducedMotion(true);
    const renderer = await ReactThreeTestRenderer.create(<Meteors />);
    expect(meteor(renderer)).toBeUndefined();
    await renderer.unmount();
  });

  it('disposes its geometry and material', async () => {
    stubReducedMotion(false);
    const geometrySpy = vi.spyOn(BufferGeometry.prototype, 'dispose');
    const materialSpy = vi.spyOn(Material.prototype, 'dispose');
    const renderer = await ReactThreeTestRenderer.create(<Meteors />);
    const mesh = meteor(renderer);
    await renderer.unmount();
    expect(geometrySpy.mock.contexts).toContain(mesh?.geometry);
    expect(materialSpy.mock.contexts).toContain(mesh?.material);
  });
});
