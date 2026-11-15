import ReactThreeTestRenderer from '@react-three/test-renderer';
import { AdditiveBlending, FrontSide, Mesh, ShaderMaterial } from 'three';
import { describe, expect, it } from 'vitest';
import { Atmosphere } from './Atmosphere';

describe('Atmosphere', () => {
  it('draws a front-faced additive shell whose shader knows the shell scale', async () => {
    const renderer = await ReactThreeTestRenderer.create(
      <Atmosphere name="test-atmosphere" radius={2} scale={1.1} color="#5ab4ff" />,
    );
    const shell = renderer.scene.instance.getObjectByName('test-atmosphere') as Mesh;
    const material = shell.material as ShaderMaterial;
    expect(shell.scale.x).toBeCloseTo(1.1);
    expect(material.uniforms.uScale?.value).toBeCloseTo(1.1);
    expect(material.side).toBe(FrontSide);
    expect(material.blending).toBe(AdditiveBlending);
    expect(material.depthWrite).toBe(false);
    await renderer.unmount();
  });
});
