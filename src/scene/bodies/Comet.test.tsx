import ReactThreeTestRenderer from '@react-three/test-renderer';
import { BufferGeometry, Material, Points, ShaderMaterial } from 'three';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { stubReducedMotion } from '../../test/reducedMotion';
import { Comet } from './Comet';
import { COMET_PRESETS } from './cometTail';

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

type Renderer = Awaited<ReturnType<typeof ReactThreeTestRenderer.create>>;
const tail = (renderer: Renderer, kind: 'ion' | 'dust') =>
  renderer.scene.instance.getObjectByName(`comet-${kind}`) as Points;
const uniform = (points: Points, name: string) =>
  (points.material as ShaderMaterial).uniforms[name]?.value as number;

async function advance(renderer: Renderer, frames: number) {
  await ReactThreeTestRenderer.act(async () => {
    await renderer.advanceFrames(frames, 1 / 30);
  });
}

describe('Comet', () => {
  it('has a nucleus, a coma and an ion and a dust tail with the preset particle counts', async () => {
    const renderer = await ReactThreeTestRenderer.create(<Comet variant="bright" radius={1} />);
    const scene = renderer.scene.instance;
    expect(scene.getObjectByName('rock-comet-nucleus')).toBeDefined();
    expect(scene.getObjectByName('comet-coma')).toBeDefined();
    for (const kind of ['ion', 'dust'] as const) {
      const points = tail(renderer, kind);
      expect(points).toBeInstanceOf(Points);
      expect(points.geometry.getAttribute('aSeed').count).toBe(COMET_PRESETS.bright[kind].count);
      expect((points.material as ShaderMaterial).vertexShader).toContain('tailParticle(');
      expect(points.frustumCulled).toBe(false);
    }
    await renderer.unmount();
  });

  it('sizes tail particles in world units, scaled to the viewport each frame', async () => {
    const renderer = await ReactThreeTestRenderer.create(<Comet variant="bright" radius={1} />);
    await advance(renderer, 1);
    // Pixels per world unit at distance 1: half the drawing-buffer height over tan(fov / 2).
    expect(uniform(tail(renderer, 'ion'), 'uScale')).toBeGreaterThan(100);
    expect(uniform(tail(renderer, 'ion'), 'uSize')).toBeLessThan(2);
    await renderer.unmount();
  });

  it('streams the tails over time', async () => {
    stubReducedMotion(false);
    const renderer = await ReactThreeTestRenderer.create(<Comet variant="bright" radius={1} />);
    await advance(renderer, 10);
    expect(uniform(tail(renderer, 'ion'), 'uTime')).toBeGreaterThan(0);
    await renderer.unmount();
  });

  it('freezes the tails under reduced motion', async () => {
    stubReducedMotion(true);
    const renderer = await ReactThreeTestRenderer.create(<Comet variant="bright" radius={1} />);
    await advance(renderer, 10);
    expect(uniform(tail(renderer, 'ion'), 'uTime')).toBe(0);
    expect(uniform(tail(renderer, 'dust'), 'uTime')).toBe(0);
    await renderer.unmount();
  });

  it('gives the upcoming (faint) comet shorter, dimmer tails', async () => {
    const bright = await ReactThreeTestRenderer.create(<Comet variant="bright" radius={1} />);
    const faint = await ReactThreeTestRenderer.create(<Comet variant="faint" radius={1} />);
    for (const kind of ['ion', 'dust'] as const) {
      expect(uniform(tail(faint, kind), 'uLength')).toBeLessThan(
        uniform(tail(bright, kind), 'uLength'),
      );
      expect(uniform(tail(faint, kind), 'uBrightness')).toBeLessThan(
        uniform(tail(bright, kind), 'uBrightness'),
      );
    }
    await bright.unmount();
    await faint.unmount();
  });

  it('is hidden when it would be only a few pixels across', async () => {
    const renderer = await ReactThreeTestRenderer.create(
      <group position={[0, 0, -10_000_000]}>
        <Comet variant="bright" radius={1} />
      </group>,
    );
    await advance(renderer, 1);
    expect(renderer.scene.instance.getObjectByName('comet')?.visible).toBe(false);
    await renderer.unmount();
  });

  it('disposes the tail buffers, coma and materials it creates', async () => {
    const geometrySpy = vi.spyOn(BufferGeometry.prototype, 'dispose');
    const materialSpy = vi.spyOn(Material.prototype, 'dispose');
    const renderer = await ReactThreeTestRenderer.create(<Comet variant="bright" radius={1} />);
    const ion = tail(renderer, 'ion');
    const dust = tail(renderer, 'dust');
    await renderer.unmount();
    for (const points of [ion, dust]) {
      expect(geometrySpy.mock.contexts).toContain(points.geometry);
      expect(materialSpy.mock.contexts).toContain(points.material);
    }
  });
});
