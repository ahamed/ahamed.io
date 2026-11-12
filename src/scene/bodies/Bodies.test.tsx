import ReactThreeTestRenderer from '@react-three/test-renderer';
import { describe, expect, it } from 'vitest';
import { STOPS } from '../../content/journey';
import { buildRoute } from '../../journey/route';
import { Bodies } from './Bodies';

describe('Bodies', () => {
  it('places Earth before the Moon along the travel direction (-Z)', async () => {
    const renderer = await ReactThreeTestRenderer.create(<Bodies route={buildRoute(STOPS)} />);
    const earth = renderer.scene.find((n) => n.instance.name === 'body-earth');
    const moon = renderer.scene.find((n) => n.instance.name === 'body-moon');
    expect(moon.instance.position.z).toBeLessThan(earth.instance.position.z);
    await renderer.unmount();
  });
});
