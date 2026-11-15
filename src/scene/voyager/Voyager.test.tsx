import ReactThreeTestRenderer from '@react-three/test-renderer';
import {
  BufferGeometry,
  Group,
  Material,
  Mesh,
  MeshStandardMaterial,
  Points,
  Texture,
  type Scene,
  type Object3D,
} from 'three';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { STOPS } from '../../content/journey';
import { buildRoute } from '../../journey/route';
import { Bodies } from '../bodies/Bodies';
import { thrusterLink } from '../../audio/thrusterLink';
import { pulseTime } from './motion';
import { VOYAGER_ORIENTATION, VOYAGER_SCALE } from './orientation';
import { PARTS, REQUIRED_PARTS } from './parts';
import { Voyager } from './Voyager';

const MOVING = ['scan', 'whip-l', 'whip-r', 'mag-tip'] as const;

function stubReducedMotion(matches: boolean) {
  vi.stubGlobal(
    'matchMedia',
    vi.fn(() => ({ matches, addEventListener: vi.fn(), removeEventListener: vi.fn() })),
  );
}

function findGroup(scene: Object3D, name: string): Group {
  const found = scene.getObjectByName(name);
  if (!(found instanceof Group)) throw new Error(`group ${name} not found`);
  return found as Group;
}

function meshes(root: Object3D): Mesh[] {
  const out: Mesh[] = [];
  root.traverse((o) => {
    if (o instanceof Mesh) out.push(o as Mesh);
  });
  return out;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

vi.mock('../ktx2', () => import('../../test/ktx2'));

describe('Voyager', () => {
  it('is built from the full museum-grade part list', () => {
    const ids = PARTS.map((p) => p.id);
    for (const id of REQUIRED_PARTS) expect(ids).toContain(id);
    expect(PARTS.length).toBeGreaterThanOrEqual(100);
  });

  it('renders merged meshes within the draw-call budget, under an attitude group', async () => {
    stubReducedMotion(false);
    const renderer = await ReactThreeTestRenderer.create(<Voyager />);
    const scene = renderer.scene.instance;
    const attitude = findGroup(scene, 'attitude');
    for (const name of MOVING) expect(attitude.getObjectByName(name)).toBeInstanceOf(Group);
    const all = meshes(scene);
    expect(all.length).toBeGreaterThan(0);
    expect(all.length).toBeLessThanOrEqual(14);
    expect(attitude.getObjectByName('static:dish')).toBeInstanceOf(Mesh);
    // Thruster puffs ride with the craft, in one extra draw call: 12 buckets + 1 = 13 of 14.
    expect(attitude.getObjectByName('thruster-puffs')).toBeInstanceOf(Points);
    let drawn = 0;
    scene.traverse((o) => {
      if (o instanceof Mesh || o instanceof Points) drawn++;
    });
    expect(drawn).toBe(13);
    await renderer.unmount();
  });

  it('moves the scan platform and attitude over time', async () => {
    stubReducedMotion(false);
    const renderer = await ReactThreeTestRenderer.create(<Voyager />);
    const scene = renderer.scene.instance;
    await ReactThreeTestRenderer.act(async () => {
      await renderer.advanceFrames(120, 1 / 20);
    });
    expect(findGroup(scene, 'scan').rotation.y).not.toBe(0);
    expect(findGroup(scene, 'attitude').rotation.x).not.toBe(0);
    await renderer.unmount();
  });

  it.each([false, true])(
    'holds a fixed three-quarter orientation above the attitude group (reduced motion %s)',
    async (reduced) => {
      stubReducedMotion(reduced);
      const renderer = await ReactThreeTestRenderer.create(<Voyager />);
      const scene = renderer.scene.instance;
      const orientation = findGroup(scene, 'orientation');
      expect(orientation.getObjectByName('attitude')).toBeInstanceOf(Group);
      expect(orientation.parent?.scale.toArray()).toEqual([
        VOYAGER_SCALE,
        VOYAGER_SCALE,
        VOYAGER_SCALE,
      ]);
      const expected = [...VOYAGER_ORIENTATION];
      expect(orientation.rotation.toArray().slice(0, 3)).toEqual(expected);
      await ReactThreeTestRenderer.act(async () => {
        await renderer.advanceFrames(120, 1 / 20);
      });
      // No roll or spin: the orientation never changes over time.
      expect(orientation.rotation.toArray().slice(0, 3)).toEqual(expected);
      await renderer.unmount();
    },
  );

  it('signals each new thruster pulse once, and none from before it mounted', async () => {
    stubReducedMotion(false);
    const fire = vi.fn();
    thrusterLink.fire = fire;
    const renderer = await ReactThreeTestRenderer.create(<Voyager />);
    // Up to just past the third pulse: pulses 0, 1 and 2 each fire once.
    const until = pulseTime(2) + 0.05;
    await ReactThreeTestRenderer.act(async () => {
      await renderer.advanceFrames(Math.ceil(until / 0.05), 0.05);
    });
    expect(fire).toHaveBeenCalledTimes(3);
    await renderer.unmount();
    thrusterLink.fire = () => undefined;
  });

  it('fires no thruster under reduced motion', async () => {
    stubReducedMotion(true);
    const fire = vi.fn();
    thrusterLink.fire = fire;
    const renderer = await ReactThreeTestRenderer.create(<Voyager />);
    await ReactThreeTestRenderer.act(async () => {
      await renderer.advanceFrames(Math.ceil(pulseTime(3) / 0.1), 0.1);
    });
    expect(fire).not.toHaveBeenCalled();
    await renderer.unmount();
    thrusterLink.fire = () => undefined;
  });

  it('holds the neutral pose under reduced motion', async () => {
    stubReducedMotion(true);
    const renderer = await ReactThreeTestRenderer.create(<Voyager />);
    const scene = renderer.scene.instance;
    for (let i = 0; i < 3; i++) {
      await ReactThreeTestRenderer.act(async () => {
        await renderer.advanceFrames(30, 1 / 10);
      });
      for (const name of ['attitude', ...MOVING]) {
        const { x, y, z } = findGroup(scene, name).rotation;
        expect([x, y, z], name).toEqual([0, 0, 0]);
      }
    }
    await renderer.unmount();
  });

  it('leaves scene.environment unset so Earth and the Moon get no Voyager reflections', async () => {
    stubReducedMotion(false);
    const renderer = await ReactThreeTestRenderer.create(
      <>
        <Bodies route={buildRoute(STOPS)} />
        <Voyager />
      </>,
    );
    const scene = renderer.scene.instance as Scene;
    expect(scene.environment).toBeNull();
    for (const name of ['body-earth', 'body-moon']) {
      const body = scene.getObjectByName(name);
      if (!body) throw new Error(`${name} not found`);
      for (const mesh of meshes(body)) {
        const material = mesh.material as Material;
        if (material instanceof MeshStandardMaterial) expect(material.envMap).toBeNull();
      }
    }
    await renderer.unmount();
  });

  it('disposes every geometry, material and texture it created on unmount', async () => {
    stubReducedMotion(false);
    const geometrySpy = vi.spyOn(BufferGeometry.prototype, 'dispose');
    const materialSpy = vi.spyOn(Material.prototype, 'dispose');
    const textureSpy = vi.spyOn(Texture.prototype, 'dispose');
    const renderer = await ReactThreeTestRenderer.create(<Voyager />);
    const all = meshes(renderer.scene.instance);
    const geometries = all.map((m) => m.geometry);
    const materials = [...new Set(all.map((m) => m.material as MeshStandardMaterial))];
    const textures = materials.flatMap((m) =>
      [m.normalMap, m.roughnessMap].filter((t): t is Texture => t !== null),
    );
    expect(textures.length).toBeGreaterThanOrEqual(3);
    geometrySpy.mockClear();
    materialSpy.mockClear();
    textureSpy.mockClear();

    await renderer.unmount();

    for (const g of geometries) expect(geometrySpy.mock.contexts).toContain(g);
    for (const m of materials) expect(materialSpy.mock.contexts).toContain(m);
    for (const t of textures) expect(textureSpy.mock.contexts).toContain(t);
  });
});
