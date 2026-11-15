import ReactThreeTestRenderer from '@react-three/test-renderer';
import { type Object3D, Quaternion, Vector3 } from 'three';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { STOPS } from '../../content/journey';
import { buildRoute } from '../../journey/route';
import { stubReducedMotion } from '../../test/reducedMotion';
import { Bodies } from './Bodies';
import { SPINS, type SpinKey } from './spin';

// Textures that load at once, so every body renders itself rather than a placeholder.
vi.mock('../ktx2', async () => {
  const { Texture } = await import('three');
  const cache = new Map<string, InstanceType<typeof Texture>>();
  return {
    useKtx2: (names: string[]) =>
      names.map((n) => {
        const texture = cache.get(n) ?? new Texture();
        cache.set(n, texture);
        return texture;
      }),
  };
});

afterEach(() => {
  vi.unstubAllGlobals();
});

const KEYS = Object.keys(SPINS) as SpinKey[];
const ELAPSED = 6; // seconds: 60 frames of 0.1 s

function spinGroups(scene: Object3D, key: SpinKey): Object3D[] {
  return scene.getObjectsByProperty('name', `spin-${key}`);
}

async function renderBodies(reduced: boolean) {
  stubReducedMotion(reduced);
  const renderer = await ReactThreeTestRenderer.create(<Bodies route={buildRoute(STOPS)} />);
  await ReactThreeTestRenderer.act(async () => {
    await renderer.advanceFrames(60, 0.1);
  });
  return renderer;
}

describe('body spin', () => {
  it('turns every body about its own axis by its own rate', async () => {
    const renderer = await renderBodies(false);
    const scene = renderer.scene.instance;
    for (const key of KEYS) {
      const groups = spinGroups(scene, key);
      expect(groups.length, key).toBeGreaterThan(0);
      const { axis, period } = SPINS[key];
      const expected = new Quaternion().setFromAxisAngle(
        new Vector3(...axis),
        (2 * Math.PI * ELAPSED) / period,
      );
      for (const group of groups)
        expect(group.quaternion.angleTo(expected), key).toBeLessThan(1e-5);
    }
    // Three comets share the nucleus spin.
    expect(spinGroups(scene, 'comet-nucleus')).toHaveLength(3);
    await renderer.unmount();
  });

  it('keeps Saturn’s rings and Earth’s clouds out of the surface spin', async () => {
    const renderer = await renderBodies(false);
    const scene = renderer.scene.instance;
    const saturn = spinGroups(scene, 'saturn')[0];
    expect(saturn?.getObjectByName('saturn-surface')).toBeDefined();
    expect(saturn?.getObjectByName('saturn-rings')).toBeUndefined();
    const earth = spinGroups(scene, 'earth')[0];
    expect(earth?.getObjectByName('spin-earth-clouds')).toBeUndefined();
    await renderer.unmount();
  });

  it('spins Pluto inside its tilt, keeping its pole (and hidden south) in place', async () => {
    const renderer = await renderBodies(false);
    const scene = renderer.scene.instance;
    const pluto = spinGroups(scene, 'pluto')[0];
    if (!pluto?.parent) throw new Error('pluto spin group not found');
    const pole = new Vector3(0, 1, 0).applyQuaternion(pluto.getWorldQuaternion(new Quaternion()));
    const restPole = new Vector3(0, 1, 0).applyQuaternion(
      pluto.parent.getWorldQuaternion(new Quaternion()),
    );
    expect(pole.angleTo(restPole)).toBeLessThan(1e-6);
    await renderer.unmount();
  });

  it('holds every body at rest under reduced motion', async () => {
    const renderer = await renderBodies(true);
    const scene = renderer.scene.instance;
    for (const key of KEYS) {
      for (const group of spinGroups(scene, key)) {
        expect(group.quaternion.angleTo(new Quaternion()), key).toBe(0);
      }
    }
    await renderer.unmount();
  });
});
