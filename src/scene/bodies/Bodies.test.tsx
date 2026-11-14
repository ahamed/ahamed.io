import ReactThreeTestRenderer from '@react-three/test-renderer';
import { describe, expect, it, vi } from 'vitest';
import { STOPS } from '../../content/journey';
import { buildRoute } from '../../journey/route';
import { Bodies } from './Bodies';

vi.mock('../ktx2', () => import('../../test/ktx2'));

describe('Bodies', () => {
  it('places all nine bodies along the travel direction (-Z) in route order', async () => {
    const renderer = await ReactThreeTestRenderer.create(<Bodies route={buildRoute(STOPS)} />);
    const zs = STOPS.map(
      (stop) =>
        renderer.scene.find((n) => n.instance.name === `body-${stop.id}`).instance.position.z,
    );
    for (let i = 1; i < zs.length; i++) expect(zs[i]).toBeLessThan(zs[i - 1] ?? 0);
    await renderer.unmount();
  });
});
