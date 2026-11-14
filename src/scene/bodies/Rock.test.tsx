import ReactThreeTestRenderer from '@react-three/test-renderer';
import { BufferGeometry, Material, Mesh, MeshStandardMaterial } from 'three';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createRockGeometry } from './rockGeometry';
import { Rock } from './Rock';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('createRockGeometry', () => {
  it('merges vertices so the displaced surface is smooth, with one colour per vertex', () => {
    const geometry = createRockGeometry('deimos', 4, '#9c8c78');
    const vertices = 10 * (4 + 1) ** 2 + 2;
    expect(geometry.getAttribute('position').count).toBe(vertices);
    expect(geometry.getAttribute('normal').count).toBe(vertices);
    expect(geometry.getAttribute('color').count).toBe(vertices);
    expect(geometry.index).not.toBeNull();
    geometry.dispose();
  });

  it('is identical for the same preset and differs between presets', () => {
    const a = createRockGeometry('phobos', 3, '#888');
    const b = createRockGeometry('phobos', 3, '#888');
    const c = createRockGeometry('deimos', 3, '#888');
    const pos = (g: BufferGeometry) => Array.from(g.getAttribute('position').array);
    expect(pos(a)).toEqual(pos(b));
    expect(pos(a)).not.toEqual(pos(c));
    for (const g of [a, b, c]) g.dispose();
  });
});

describe('Rock', () => {
  it('renders a vertex-coloured rocky mesh named by its preset, scaled to its radius', async () => {
    const renderer = await ReactThreeTestRenderer.create(<Rock preset="phobos" radius={0.7} />);
    const mesh = renderer.scene.instance.getObjectByName('rock-phobos');
    expect(mesh).toBeInstanceOf(Mesh);
    const material = (mesh as Mesh).material as MeshStandardMaterial;
    expect(material.vertexColors).toBe(true);
    expect(mesh?.scale.x).toBeCloseTo(0.7);
    await renderer.unmount();
  });

  it('disposes its geometry and material on unmount', async () => {
    const geometrySpy = vi.spyOn(BufferGeometry.prototype, 'dispose');
    const materialSpy = vi.spyOn(Material.prototype, 'dispose');
    const renderer = await ReactThreeTestRenderer.create(<Rock preset="ceres" radius={1.2} />);
    const mesh = renderer.scene.instance.getObjectByName('rock-ceres') as Mesh;
    await renderer.unmount();
    expect(geometrySpy.mock.contexts).toContain(mesh.geometry);
    expect(materialSpy.mock.contexts).toContain(mesh.material);
  });
});

describe('Rock draw distance', () => {
  async function visibleAt(z: number) {
    const renderer = await ReactThreeTestRenderer.create(
      <group position={[0, 0, z]}>
        <Rock preset="deimos" radius={0.5} />
      </group>,
    );
    await ReactThreeTestRenderer.act(async () => {
      await renderer.advanceFrames(1, 1 / 60);
    });
    const visible = renderer.scene.instance.getObjectByName('rock-deimos')?.visible;
    await renderer.unmount();
    return visible;
  }

  it('is drawn near the camera', async () => {
    expect(await visibleAt(-20)).toBe(true);
  });

  it('is hidden when it would be only a few pixels across', async () => {
    expect(await visibleAt(-100_000)).toBe(false);
  });
});
