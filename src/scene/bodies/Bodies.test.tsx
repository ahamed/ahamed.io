import ReactThreeTestRenderer from '@react-three/test-renderer';
import { describe, expect, it, vi } from 'vitest';
import { STOPS } from '../../content/journey';
import { buildRoute } from '../../journey/route';
import { Bodies } from './Bodies';

// Textures that load at once (a fresh blank texture per name), so each body renders itself.
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

describe('Bodies', () => {
  it('places all 27 stops along the travel direction (-Z) in route order', async () => {
    const renderer = await ReactThreeTestRenderer.create(<Bodies route={buildRoute(STOPS)} />);
    const zs = STOPS.map(
      (stop) =>
        renderer.scene.find((n) => n.instance.name === `body-${stop.id}`).instance.position.z,
    );
    for (let i = 1; i < zs.length; i++) expect(zs[i]).toBeLessThan(zs[i - 1] ?? 0);
    await renderer.unmount();
  });

  it('draws the gas giants and their moons with their own components', async () => {
    const renderer = await ReactThreeTestRenderer.create(<Bodies route={buildRoute(STOPS)} />);
    const scene = renderer.scene.instance;
    expect(scene.getObjectByName('jupiter-surface')).toBeDefined();
    expect(scene.getObjectByName('saturn-rings')).toBeDefined();
    for (const moon of [
      'io',
      'europa',
      'ganymede',
      'callisto',
      'titan',
      'rhea',
      'iapetus',
      'enceladus',
    ]) {
      expect(scene.getObjectByName(`moon-${moon}`), moon).toBeDefined();
    }
    await renderer.unmount();
  });

  it('draws the comets, Pluto, Charon, Arrokoth and Eris with their own components', async () => {
    const renderer = await ReactThreeTestRenderer.create(<Bodies route={buildRoute(STOPS)} />);
    const scene = renderer.scene.instance;
    const comets: string[] = [];
    scene.traverse((o) => {
      if (o.name === 'comet') comets.push(o.uuid);
    });
    expect(comets).toHaveLength(3);
    expect(scene.getObjectByName('moon-pluto')).toBeDefined();
    expect(scene.getObjectByName('moon-charon')).toBeDefined();
    expect(scene.getObjectByName('arrokoth')).toBeDefined();
    expect(scene.getObjectByName('rock-eris')).toBeDefined();
    await renderer.unmount();
  });

  it('draws nothing at the heliopause anchor (the shells are drawn by Heliopause)', async () => {
    const renderer = await ReactThreeTestRenderer.create(<Bodies route={buildRoute(STOPS)} />);
    const anchor = renderer.scene.instance.getObjectByName('body-heliopause');
    expect(anchor).toBeDefined();
    expect(anchor?.children).toHaveLength(0);
    await renderer.unmount();
  });
});
