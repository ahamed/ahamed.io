import ReactThreeTestRenderer from '@react-three/test-renderer';
import { Material, Mesh, MeshStandardMaterial, RepeatWrapping, Texture } from 'three';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { stubReducedMotion } from '../../test/reducedMotion';
import { Jupiter } from './Jupiter';

const map = new Texture();
const requested: string[][] = [];

vi.mock('../ktx2', () => ({
  useKtx2: (names: string[]) => {
    requested.push(names);
    return names.map(() => map);
  },
}));

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

const surfaceOf = (renderer: Awaited<ReturnType<typeof ReactThreeTestRenderer.create>>) =>
  renderer.scene.instance.getObjectByName('jupiter-surface') as Mesh;

/** The uTime uniform the band shader reads, handed over by onBeforeCompile. */
function compileUniforms(material: MeshStandardMaterial) {
  const shader = {
    uniforms: {} as Record<string, { value: unknown }>,
    vertexShader: '',
    fragmentShader: 'void main() {\n#include <map_fragment>\n#include <opaque_fragment>\n}',
  };
  material.onBeforeCompile(shader as never, undefined as never);
  return shader;
}

async function advance(
  renderer: Awaited<ReturnType<typeof ReactThreeTestRenderer.create>>,
  frames: number,
) {
  await ReactThreeTestRenderer.act(async () => {
    await renderer.advanceFrames(frames, 1 / 30);
  });
}

describe('Jupiter', () => {
  it('maps the Jupiter texture, repeating sideways, onto a sphere of the given radius', async () => {
    const renderer = await ReactThreeTestRenderer.create(<Jupiter radius={16} />);
    expect(requested).toContainEqual(['2k_jupiter']);
    const surface = surfaceOf(renderer);
    expect((surface.material as MeshStandardMaterial).map).toBe(map);
    expect(map.wrapS).toBe(RepeatWrapping);
    surface.geometry.computeBoundingSphere();
    expect(surface.geometry.boundingSphere?.radius).toBeCloseTo(16, 3);
    await renderer.unmount();
  });

  it('shifts the map lookup per band and darkens the limb in its shader', async () => {
    const renderer = await ReactThreeTestRenderer.create(<Jupiter radius={16} />);
    const shader = compileUniforms(surfaceOf(renderer).material as MeshStandardMaterial);
    expect(shader.fragmentShader).toContain('float bandOffset(float v, float t)');
    expect(shader.fragmentShader).toContain('textureGrad(map');
    expect(shader.fragmentShader).not.toContain('#include <map_fragment>');
    expect(shader.fragmentShader).toContain('limb');
    expect(shader.uniforms.uTime).toBeDefined();
    await renderer.unmount();
  });

  it('advances the band clock over time', async () => {
    stubReducedMotion(false);
    const renderer = await ReactThreeTestRenderer.create(<Jupiter radius={16} />);
    const shader = compileUniforms(surfaceOf(renderer).material as MeshStandardMaterial);
    await advance(renderer, 10);
    expect(shader.uniforms.uTime?.value).toBeGreaterThan(0);
    await renderer.unmount();
  });

  it('freezes the bands and the spin under reduced motion', async () => {
    stubReducedMotion(true);
    const renderer = await ReactThreeTestRenderer.create(<Jupiter radius={16} />);
    const surface = surfaceOf(renderer);
    const shader = compileUniforms(surface.material as MeshStandardMaterial);
    const spin = surface.rotation.y;
    await advance(renderer, 10);
    expect(shader.uniforms.uTime?.value).toBe(0);
    expect(surface.rotation.y).toBe(spin);
    await renderer.unmount();
  });

  it('is hidden when it would be only a few pixels across', async () => {
    const renderer = await ReactThreeTestRenderer.create(
      <group position={[0, 0, -10_000_000]}>
        <Jupiter radius={16} />
      </group>,
    );
    await advance(renderer, 1);
    expect(renderer.scene.instance.getObjectByName('jupiter')?.visible).toBe(false);
    await renderer.unmount();
  });

  it('disposes the material it creates on unmount', async () => {
    const spy = vi.spyOn(Material.prototype, 'dispose');
    const renderer = await ReactThreeTestRenderer.create(<Jupiter radius={16} />);
    const material = surfaceOf(renderer).material;
    await renderer.unmount();
    expect(spy.mock.contexts).toContain(material);
  });
});
