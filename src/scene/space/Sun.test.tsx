import ReactThreeTestRenderer from '@react-three/test-renderer';
import {
  BufferGeometry,
  Material,
  Mesh,
  ShaderMaterial,
  Texture,
  Vector3,
  type Object3D,
} from 'three';
import { Lensflare } from 'three/addons/objects/Lensflare.js';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { stubReducedMotion } from '../../test/reducedMotion';
import { Sun } from './Sun';
import { SUN_DIRECTION } from './sunDirection';

const SUN = new Vector3(...SUN_DIRECTION);

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

function find(root: Object3D, name: string): Object3D {
  const found = root.getObjectByName(name);
  if (!found) throw new Error(`${name} not found`);
  return found;
}

async function renderSun() {
  const renderer = await ReactThreeTestRenderer.create(<Sun />);
  const scene = renderer.scene.instance;
  const corona = find(scene, 'sun-corona') as Mesh;
  const material = corona.material as ShaderMaterial;
  return { renderer, scene, corona, time: () => material.uniforms.uTime?.value as number };
}

const advance = async (renderer: Awaited<ReturnType<typeof ReactThreeTestRenderer.create>>) => {
  await ReactThreeTestRenderer.act(async () => {
    await renderer.advanceFrames(20, 1 / 20);
  });
};

describe('Sun', () => {
  it('puts the disc, corona and flare along the shared Sun direction, facing back', async () => {
    stubReducedMotion(false);
    const { renderer, scene } = await renderSun();
    scene.updateMatrixWorld(true);
    for (const name of ['sun-disc', 'sun-corona', 'sun-flare']) {
      const object = find(scene, name);
      const position = object.getWorldPosition(new Vector3());
      expect(position.clone().normalize().angleTo(SUN), name).toBeLessThan(1e-6);
      expect(position.length(), name).toBeGreaterThan(1000);
    }
    expect(find(scene, 'sun-flare')).toBeInstanceOf(Lensflare);
    // The quads face the origin, where the camera-following group puts the camera.
    const normal = new Vector3(0, 0, 1).applyQuaternion(find(scene, 'sun-disc').quaternion);
    expect(normal.angleTo(SUN.clone().negate())).toBeLessThan(1e-6);
    await renderer.unmount();
  });

  it('animates the corona over time', async () => {
    stubReducedMotion(false);
    const { renderer, time } = await renderSun();
    const before = time();
    await advance(renderer);
    expect(time()).toBeGreaterThan(before);
    await renderer.unmount();
  });

  it('holds the corona still under reduced motion', async () => {
    stubReducedMotion(true);
    const { renderer, time } = await renderSun();
    const before = time();
    await advance(renderer);
    expect(time()).toBe(before);
    await renderer.unmount();
  });

  it('disposes its geometry, materials, flare and flare textures on unmount', async () => {
    stubReducedMotion(false);
    const geometrySpy = vi.spyOn(BufferGeometry.prototype, 'dispose');
    const materialSpy = vi.spyOn(Material.prototype, 'dispose');
    const textureSpy = vi.spyOn(Texture.prototype, 'dispose');
    const { renderer, scene } = await renderSun();
    const flare = find(scene, 'sun-flare') as Lensflare;
    const flareDispose = vi.spyOn(flare, 'dispose');
    const meshes = ['sun-disc', 'sun-corona'].map((n) => find(scene, n) as Mesh);
    await renderer.unmount();
    expect(flareDispose).toHaveBeenCalled();
    for (const mesh of meshes) {
      expect(geometrySpy.mock.contexts).toContain(mesh.geometry);
      expect(materialSpy.mock.contexts).toContain(mesh.material);
    }
    expect(textureSpy.mock.calls.length).toBeGreaterThanOrEqual(2);
  });
});
