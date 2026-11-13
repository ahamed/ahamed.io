import ReactThreeTestRenderer from '@react-three/test-renderer';
import { AmbientLight, DirectionalLight, Vector3 } from 'three';
import { describe, expect, it } from 'vitest';
import { Lights } from './Lights';
import { SUN_DIRECTION } from './space/sunDirection';

describe('Lights', () => {
  it('places the key light along the shared Sun direction', async () => {
    const renderer = await ReactThreeTestRenderer.create(<Lights />);
    const lights = renderer.scene.instance.children;
    const key = lights.find((o): o is DirectionalLight => o instanceof DirectionalLight);
    if (!key) throw new Error('no key light');
    const direction = key.position.clone().normalize();
    expect(direction.angleTo(new Vector3(...SUN_DIRECTION))).toBeLessThan(1e-9);
    expect(lights.some((o) => o instanceof AmbientLight)).toBe(true);
    await renderer.unmount();
  });
});
