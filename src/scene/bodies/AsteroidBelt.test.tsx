import ReactThreeTestRenderer from '@react-three/test-renderer';
import { BufferGeometry, InstancedMesh, Material, type Object3D } from 'three';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { stubReducedMotion } from '../../test/reducedMotion';
import { AsteroidBelt } from './AsteroidBelt';
import type { BeltOptions } from './belt';

const options: BeltOptions = {
  count: 600,
  seed: 5,
  zStart: -100,
  zEnd: -400,
  corridor: 16,
  outer: 140,
  thickness: 30,
};

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

function instanced(root: Object3D): InstancedMesh[] {
  const out: InstancedMesh[] = [];
  root.traverse((o) => {
    if (o instanceof InstancedMesh) out.push(o as InstancedMesh);
  });
  return out;
}

async function renderBelt() {
  const renderer = await ReactThreeTestRenderer.create(<AsteroidBelt options={options} />);
  const meshes = instanced(renderer.scene.instance);
  const material = meshes[0]?.material as Material;
  const time = () => (material.userData.uTime as { value: number }).value;
  const frames = async () => {
    await ReactThreeTestRenderer.act(async () => {
      await renderer.advanceFrames(20, 1 / 20);
    });
  };
  return { renderer, meshes, time, frames };
}

describe('AsteroidBelt presets', () => {
  it('names the belt and tints its rocks with the given colour', async () => {
    const plain = await ReactThreeTestRenderer.create(<AsteroidBelt options={options} />);
    const icy = await ReactThreeTestRenderer.create(
      <AsteroidBelt options={options} name="kuiper-belt" color="#9fb0c2" />,
    );
    expect(plain.scene.instance.getObjectByName('asteroid-belt')).toBeDefined();
    expect(icy.scene.instance.getObjectByName('kuiper-belt')).toBeDefined();
    const firstColour = (root: Object3D) =>
      Array.from(instanced(root)[0]?.geometry.getAttribute('color').array.slice(0, 3) ?? []);
    expect(firstColour(icy.scene.instance)).not.toEqual(firstColour(plain.scene.instance));
    await plain.unmount();
    await icy.unmount();
  });
});

describe('AsteroidBelt', () => {
  it('draws every rock with at most 3 instanced meshes', async () => {
    stubReducedMotion(false);
    const { renderer, meshes } = await renderBelt();
    expect(meshes.length).toBeGreaterThan(0);
    expect(meshes.length).toBeLessThanOrEqual(3);
    expect(meshes.reduce((n, m) => n + m.count, 0)).toBe(options.count);
    for (const mesh of meshes) {
      expect(mesh.geometry.getAttribute('aSpinAxis').count).toBe(mesh.count);
      expect(mesh.geometry.getAttribute('aSpinRate').count).toBe(mesh.count);
    }
    await renderer.unmount();
  });

  it('tumbles the rocks over time', async () => {
    stubReducedMotion(false);
    const { renderer, time, frames } = await renderBelt();
    const before = time();
    await frames();
    expect(time()).toBeGreaterThan(before);
    await renderer.unmount();
  });

  it('holds the rocks still under reduced motion, while still drawing them', async () => {
    stubReducedMotion(true);
    const { renderer, meshes, time, frames } = await renderBelt();
    const before = time();
    await frames();
    expect(time()).toBe(before);
    expect(meshes.every((m) => m.visible && m.count > 0)).toBe(true);
    await renderer.unmount();
  });

  it('disposes its geometries, material and instance buffers on unmount', async () => {
    stubReducedMotion(false);
    const geometrySpy = vi.spyOn(BufferGeometry.prototype, 'dispose');
    const materialSpy = vi.spyOn(Material.prototype, 'dispose');
    const meshSpy = vi.spyOn(InstancedMesh.prototype, 'dispose');
    const { renderer, meshes } = await renderBelt();
    await renderer.unmount();
    for (const mesh of meshes) {
      expect(geometrySpy.mock.contexts).toContain(mesh.geometry);
      expect(materialSpy.mock.contexts).toContain(mesh.material);
      expect(meshSpy.mock.contexts).toContain(mesh);
    }
  });
});

describe('AsteroidBelt draw distance', () => {
  async function beltVisible(beltOptions: BeltOptions) {
    stubReducedMotion(false);
    const renderer = await ReactThreeTestRenderer.create(<AsteroidBelt options={beltOptions} />);
    await ReactThreeTestRenderer.act(async () => {
      await renderer.advanceFrames(1, 1 / 60);
    });
    const visible = renderer.scene.instance.getObjectByName('asteroid-belt')?.visible;
    await renderer.unmount();
    return visible;
  }

  it('is drawn while the camera is near the belt', async () => {
    expect(await beltVisible(options)).toBe(true);
  });

  it('is hidden while the camera is far from the belt', async () => {
    expect(await beltVisible({ ...options, zStart: -50_000, zEnd: -60_000 })).toBe(false);
  });
});

describe('AsteroidBelt quality', () => {
  const drawn = (meshes: InstancedMesh[]) => meshes.reduce((n, m) => n + m.count, 0);

  it('draws about a third of the rocks at the low tier, keeping the full buffers', async () => {
    stubReducedMotion(false);
    const renderer = await ReactThreeTestRenderer.create(
      <AsteroidBelt options={options} tier="low" />,
    );
    const meshes = instanced(renderer.scene.instance);
    expect(drawn(meshes) / options.count).toBeCloseTo(0.35, 1);
    const capacity = meshes.reduce((n, m) => n + m.instanceMatrix.count, 0);
    expect(capacity).toBe(options.count);
    await renderer.unmount();
  });

  it('draws every rock at the high tier', async () => {
    stubReducedMotion(false);
    const renderer = await ReactThreeTestRenderer.create(
      <AsteroidBelt options={options} tier="high" />,
    );
    expect(drawn(instanced(renderer.scene.instance))).toBe(options.count);
    await renderer.unmount();
  });
});
