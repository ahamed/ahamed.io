import ReactThreeTestRenderer from '@react-three/test-renderer';
import { BufferGeometry, LineSegments, Material, ShaderMaterial } from 'three';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { journeyRuntime } from '../../store/journey';
import { stubReducedMotion } from '../../test/reducedMotion';
import { DUST_COUNT, SpeedDust } from './SpeedDust';

beforeEach(() => {
  journeyRuntime.speed = 0;
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

async function renderDust() {
  const renderer = await ReactThreeTestRenderer.create(<SpeedDust />);
  const found = renderer.scene.instance.getObjectByName('speed-dust');
  const frames = async () => {
    await ReactThreeTestRenderer.act(async () => {
      await renderer.advanceFrames(3, 1 / 60);
    });
  };
  return { renderer, found, frames };
}

function uniformsOf(lines: LineSegments) {
  const { uniforms } = lines.material as ShaderMaterial;
  return {
    opacity: uniforms.uOpacity?.value as number,
    stretch: uniforms.uStretch?.value as number,
  };
}

describe('SpeedDust', () => {
  it('draws every particle as one two-vertex segment in a single object', async () => {
    stubReducedMotion(false);
    const { renderer, found } = await renderDust();
    expect(found).toBeInstanceOf(LineSegments);
    const lines = found as LineSegments;
    expect(DUST_COUNT).toBeGreaterThanOrEqual(1000);
    expect(lines.geometry.getAttribute('position').count).toBe(DUST_COUNT * 2);
    expect(lines.frustumCulled).toBe(false);
    await renderer.unmount();
  });

  it('is invisible and unstretched at rest', async () => {
    stubReducedMotion(false);
    const { renderer, found, frames } = await renderDust();
    await frames();
    const lines = found as LineSegments;
    expect(uniformsOf(lines)).toEqual({ opacity: 0, stretch: 0 });
    expect(lines.visible).toBe(false);
    await renderer.unmount();
  });

  it('streaks and brightens while travelling', async () => {
    stubReducedMotion(false);
    const { renderer, found, frames } = await renderDust();
    journeyRuntime.speed = 0.2;
    await frames();
    const lines = found as LineSegments;
    const { opacity, stretch } = uniformsOf(lines);
    expect(opacity).toBeGreaterThan(0);
    expect(stretch).toBeGreaterThan(0);
    expect(lines.visible).toBe(true);
    await renderer.unmount();
  });

  it('draws nothing under reduced motion', async () => {
    stubReducedMotion(true);
    journeyRuntime.speed = 0.2;
    const { renderer, found } = await renderDust();
    expect(found).toBeUndefined();
    await renderer.unmount();
  });

  it('disposes its geometry and material on unmount', async () => {
    stubReducedMotion(false);
    const geometrySpy = vi.spyOn(BufferGeometry.prototype, 'dispose');
    const materialSpy = vi.spyOn(Material.prototype, 'dispose');
    const { renderer, found } = await renderDust();
    const lines = found as LineSegments;
    await renderer.unmount();
    expect(geometrySpy.mock.contexts).toContain(lines.geometry);
    expect(materialSpy.mock.contexts).toContain(lines.material);
  });
});

describe('SpeedDust quality', () => {
  it('draws about a third of the streaks at the low tier', async () => {
    stubReducedMotion(false);
    const renderer = await ReactThreeTestRenderer.create(<SpeedDust tier="low" />);
    const lines = renderer.scene.instance.getObjectByName('speed-dust') as LineSegments;
    expect(lines.geometry.drawRange.count).toBe(Math.round(DUST_COUNT * 0.35) * 2);
    await renderer.unmount();
  });
});
