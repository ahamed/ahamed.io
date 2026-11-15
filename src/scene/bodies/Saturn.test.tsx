import ReactThreeTestRenderer from '@react-three/test-renderer';
import {
  BufferGeometry,
  Material,
  Mesh,
  MeshStandardMaterial,
  ShaderMaterial,
  Texture,
  Vector3,
} from 'three';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { RING_INNER, RING_OUTER } from '../../journey/route';
import { stubReducedMotion } from '../../test/reducedMotion';
import { SUN_DIRECTION } from '../space/sunDirection';
import { Saturn } from './Saturn';

const textures: Record<string, Texture> = {};
const requested: string[][] = [];

vi.mock('../ktx2', () => ({
  useKtx2: (names: string[]) => {
    requested.push(names);
    return names.map((n) => (textures[n] ??= new Texture()));
  },
}));

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

type Renderer = Awaited<ReturnType<typeof ReactThreeTestRenderer.create>>;
const byName = (renderer: Renderer, name: string) =>
  renderer.scene.instance.getObjectByName(name) as Mesh;

async function advance(renderer: Renderer, frames: number) {
  await ReactThreeTestRenderer.act(async () => {
    await renderer.advanceFrames(frames, 1 / 30);
  });
}

const R = 13;

describe('Saturn', () => {
  it('maps the Saturn texture onto the planet and the ring strip onto the rings', async () => {
    const renderer = await ReactThreeTestRenderer.create(<Saturn radius={R} />);
    expect(requested).toContainEqual(['2k_saturn', '2k_saturn_ring_alpha']);
    const surface = byName(renderer, 'saturn-surface');
    expect((surface.material as MeshStandardMaterial).map).toBe(textures['2k_saturn']);
    const rings = byName(renderer, 'saturn-rings');
    const material = rings.material as ShaderMaterial;
    expect(material.uniforms.uRingStrip?.value).toBe(textures['2k_saturn_ring_alpha']);
    expect(material.transparent).toBe(true);
    expect(material.depthWrite).toBe(false);
    await renderer.unmount();
  });

  it('spans the rings from the C ring to the A ring edge', async () => {
    const renderer = await ReactThreeTestRenderer.create(<Saturn radius={R} />);
    const ring = byName(renderer, 'saturn-rings').geometry;
    const p = ring.getAttribute('position');
    let min = Infinity;
    let max = 0;
    for (let i = 0; i < p.count; i++) {
      const r = Math.hypot(p.getX(i), p.getY(i), p.getZ(i));
      min = Math.min(min, r);
      max = Math.max(max, r);
    }
    expect(min).toBeCloseTo(RING_INNER * R, 3);
    expect(max).toBeCloseTo(RING_OUTER * R, 3);
    await renderer.unmount();
  });

  it('tilts the rings 26.7° so they open toward the approaching camera (+Z)', async () => {
    const renderer = await ReactThreeTestRenderer.create(<Saturn radius={R} />);
    await advance(renderer, 1);
    const uniforms = (byName(renderer, 'saturn-rings').material as ShaderMaterial).uniforms;
    const normal = uniforms.uNormal?.value as Vector3;
    const tilt = (26.7 * Math.PI) / 180;
    expect(normal.y).toBeCloseTo(Math.cos(tilt), 3);
    expect(normal.z).toBeCloseTo(Math.sin(tilt), 3);
    expect(normal.x).toBeCloseTo(0, 6);
    await renderer.unmount();
  });

  it('feeds both shadow shaders the sun direction, planet centre and ring edges', async () => {
    const renderer = await ReactThreeTestRenderer.create(
      <group position={[46, 0, -4700]}>
        <Saturn radius={R} />
      </group>,
    );
    await advance(renderer, 1);
    const uniforms = (byName(renderer, 'saturn-rings').material as ShaderMaterial).uniforms;
    expect((uniforms.uSun?.value as Vector3).toArray()).toEqual([...SUN_DIRECTION]);
    expect((uniforms.uCentre?.value as Vector3).toArray()).toEqual([46, 0, -4700]);
    expect(uniforms.uRadius?.value).toBe(R);
    expect(uniforms.uInner?.value).toBeCloseTo(RING_INNER * R, 9);
    expect(uniforms.uOuter?.value).toBeCloseTo(RING_OUTER * R, 9);
    await renderer.unmount();
  });

  it('shades the rings with the planet’s shadow and the planet with the rings’ shadow', async () => {
    const renderer = await ReactThreeTestRenderer.create(<Saturn radius={R} />);
    const ringShader = (byName(renderer, 'saturn-rings').material as ShaderMaterial).fragmentShader;
    expect(ringShader).toContain('planetShadowsRing(');
    const surface = byName(renderer, 'saturn-surface').material as MeshStandardMaterial;
    const shader = {
      uniforms: {} as Record<string, { value: unknown }>,
      vertexShader: 'void main() {\n#include <project_vertex>\n}',
      fragmentShader: 'void main() {\n#include <opaque_fragment>\n}',
    };
    surface.onBeforeCompile(shader as never, undefined as never);
    expect(shader.fragmentShader).toContain('ringShadowOnPlanet(');
    expect(shader.uniforms.uRingStrip?.value).toBe(textures['2k_saturn_ring_alpha']);
    expect(shader.vertexShader).toContain('vSaturnWorld');
    await renderer.unmount();
  });

  it('freezes its spin under reduced motion', async () => {
    stubReducedMotion(true);
    const renderer = await ReactThreeTestRenderer.create(<Saturn radius={R} />);
    const surface = byName(renderer, 'saturn-surface');
    await advance(renderer, 10);
    expect(surface.parent?.name).toBe('spin-saturn');
    expect(surface.parent?.quaternion.toArray()).toEqual([0, 0, 0, 1]);
    await renderer.unmount();
  });

  it('hides the planet and rings together when only a few pixels across', async () => {
    const renderer = await ReactThreeTestRenderer.create(
      <group position={[0, 0, -10_000_000]}>
        <Saturn radius={R} />
      </group>,
    );
    await advance(renderer, 1);
    expect(renderer.scene.instance.getObjectByName('saturn')?.visible).toBe(false);
    await renderer.unmount();
  });

  it('disposes the geometry and materials it creates', async () => {
    const geometrySpy = vi.spyOn(BufferGeometry.prototype, 'dispose');
    const materialSpy = vi.spyOn(Material.prototype, 'dispose');
    const renderer = await ReactThreeTestRenderer.create(<Saturn radius={R} />);
    const rings = byName(renderer, 'saturn-rings');
    const surface = byName(renderer, 'saturn-surface');
    await renderer.unmount();
    expect(geometrySpy.mock.contexts).toContain(rings.geometry);
    expect(materialSpy.mock.contexts).toContain(rings.material);
    expect(materialSpy.mock.contexts).toContain(surface.material);
  });
});
