import {
  BufferGeometry,
  Material,
  Texture,
  type PMREMGenerator,
  type Scene,
  type WebGLRenderer,
} from 'three';
import { describe, expect, it, vi } from 'vitest';
import { createSpaceEnvironment } from './environment';

function stubPmrem() {
  const texture = new Texture();
  const target = { texture, dispose: vi.fn() };
  let captured: Scene | null = null;
  const generator = {
    fromScene: vi.fn((scene: Scene) => {
      captured = scene;
      return target;
    }),
    dispose: vi.fn(),
  };
  return {
    target,
    generator,
    scene: () => captured,
    factory: () => generator as unknown as PMREMGenerator,
  };
}

const fakeRenderer = {} as WebGLRenderer;

describe('createSpaceEnvironment', () => {
  it('returns null when there is no WebGL renderer', () => {
    expect(createSpaceEnvironment(null)).toBeNull();
  });

  it('prefilters a procedural space scene once and returns its texture', () => {
    const pmrem = stubPmrem();
    const env = createSpaceEnvironment(fakeRenderer, pmrem.factory);
    expect(pmrem.generator.fromScene).toHaveBeenCalledTimes(1);
    expect(env?.texture).toBe(pmrem.target.texture);
    // Sky, warm sun patch and blue fill.
    expect(pmrem.scene()?.children.length).toBeGreaterThanOrEqual(3);
    expect(pmrem.generator.dispose).toHaveBeenCalled();
  });

  it('disposes the throwaway scene straight away and the target on dispose()', () => {
    const geometrySpy = vi.spyOn(BufferGeometry.prototype, 'dispose');
    const materialSpy = vi.spyOn(Material.prototype, 'dispose');
    const pmrem = stubPmrem();
    const env = createSpaceEnvironment(fakeRenderer, pmrem.factory);
    expect(geometrySpy.mock.calls.length).toBeGreaterThanOrEqual(3);
    expect(materialSpy.mock.calls.length).toBeGreaterThanOrEqual(3);
    expect(pmrem.target.dispose).not.toHaveBeenCalled();
    env?.dispose();
    expect(pmrem.target.dispose).toHaveBeenCalledTimes(1);
  });

  it('falls back to null when prefiltering fails, still releasing everything', () => {
    const materialSpy = vi.spyOn(Material.prototype, 'dispose');
    const pmrem = stubPmrem();
    pmrem.generator.fromScene.mockImplementation(() => {
      throw new TypeError('no real WebGL context');
    });
    expect(createSpaceEnvironment(fakeRenderer, pmrem.factory)).toBeNull();
    expect(pmrem.generator.dispose).toHaveBeenCalled();
    expect(materialSpy.mock.calls.length).toBeGreaterThanOrEqual(3);
  });
});
