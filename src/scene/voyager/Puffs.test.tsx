import ReactThreeTestRenderer from '@react-three/test-renderer';
import { AdditiveBlending, BufferGeometry, Material, Points, ShaderMaterial } from 'three';
import { describe, expect, it, vi } from 'vitest';
import { NOZZLES } from './parts';
import { Puffs } from './Puffs';

function pointsOf(renderer: Awaited<ReturnType<typeof ReactThreeTestRenderer.create>>): Points {
  const found = renderer.scene.instance.getObjectByName('thruster-puffs');
  if (!(found instanceof Points)) throw new Error('puffs not found');
  return found as Points;
}

describe('Puffs', () => {
  it('draws one additive point per nozzle, at the nozzle, without writing depth', async () => {
    const brightness = new Float32Array(12);
    const renderer = await ReactThreeTestRenderer.create(<Puffs brightness={brightness} />);
    const points = pointsOf(renderer);
    const position = points.geometry.getAttribute('position');
    expect(position.count).toBe(12);
    NOZZLES.forEach(([x, y], k) => {
      expect(position.getX(k)).toBeCloseTo(x, 6);
      expect(position.getY(k)).toBeCloseTo(y, 6);
    });
    const material = points.material as ShaderMaterial;
    expect(material.blending).toBe(AdditiveBlending);
    expect(material.depthWrite).toBe(false);
    expect(material.transparent).toBe(true);
    await renderer.unmount();
  });

  it('follows the brightness it is given each frame', async () => {
    const brightness = new Float32Array(12);
    const renderer = await ReactThreeTestRenderer.create(<Puffs brightness={brightness} />);
    const attribute = pointsOf(renderer).geometry.getAttribute('aBrightness');
    brightness[3] = 0.8;
    await ReactThreeTestRenderer.act(async () => {
      await renderer.advanceFrames(1, 1 / 60);
    });
    expect(attribute.getX(3)).toBeCloseTo(0.8, 6);
    expect(attribute.getX(0)).toBe(0);
    brightness[3] = 0;
    await ReactThreeTestRenderer.act(async () => {
      await renderer.advanceFrames(1, 1 / 60);
    });
    expect(attribute.getX(3)).toBe(0);
    await renderer.unmount();
  });

  it('disposes its geometry and material on unmount', async () => {
    const geometrySpy = vi.spyOn(BufferGeometry.prototype, 'dispose');
    const materialSpy = vi.spyOn(Material.prototype, 'dispose');
    const renderer = await ReactThreeTestRenderer.create(
      <Puffs brightness={new Float32Array(12)} />,
    );
    const points = pointsOf(renderer);
    await renderer.unmount();
    expect(geometrySpy.mock.contexts).toContain(points.geometry);
    expect(materialSpy.mock.contexts).toContain(points.material);
    geometrySpy.mockRestore();
    materialSpy.mockRestore();
  });
});
