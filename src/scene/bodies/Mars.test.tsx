import ReactThreeTestRenderer from '@react-three/test-renderer';
import { Color, Mesh, MeshStandardMaterial, ShaderMaterial, Texture } from 'three';
import { describe, expect, it, vi } from 'vitest';
import { Mars } from './Mars';

const map = new Texture();
const requested: string[][] = [];

vi.mock('../ktx2', () => ({
  useKtx2: (names: string[]) => {
    requested.push(names);
    return names.map(() => map);
  },
}));

describe('Mars', () => {
  it('maps the Mars texture onto a sphere of the given radius', async () => {
    const renderer = await ReactThreeTestRenderer.create(<Mars radius={3.4} />);
    expect(requested).toContainEqual(['2k_mars']);
    const surface = renderer.scene.instance.getObjectByName('mars-surface') as Mesh;
    expect((surface.material as MeshStandardMaterial).map).toBe(map);
    await renderer.unmount();
  });

  it('wraps Mars in a thin, orange-tinted atmosphere rim', async () => {
    const renderer = await ReactThreeTestRenderer.create(<Mars radius={3.4} />);
    const rim = renderer.scene.instance.getObjectByName('mars-atmosphere') as Mesh;
    const color = ((rim.material as ShaderMaterial).uniforms.uColor?.value as Color).clone();
    expect(color.r).toBeGreaterThan(color.g);
    expect(color.g).toBeGreaterThan(color.b);
    expect(rim.scale.x).toBeLessThan(1.08);
    await renderer.unmount();
  });
});
