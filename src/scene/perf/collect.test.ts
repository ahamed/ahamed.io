import {
  CanvasTexture,
  CompressedTexture,
  DataTexture,
  HalfFloatType,
  Mesh,
  MeshStandardMaterial,
  RGBA_BPTC_Format,
  RGBAFormat,
  Scene,
  ShaderMaterial,
  SphereGeometry,
  Texture,
  WebGLRenderTarget,
} from 'three';
import { describe, expect, it } from 'vitest';
import {
  collectTextureBytes,
  countSceneGeometries,
  renderTargetBytes,
  textureShapeOf,
} from './collect';

const data = (w: number, h: number) => {
  const t = new DataTexture(new Uint8Array(w * h * 4), w, h, RGBAFormat);
  t.generateMipmaps = false;
  return t;
};

describe('textureShapeOf', () => {
  it('reads a data texture without mipmaps', () => {
    expect(textureShapeOf(data(8, 4))).toMatchObject({ width: 8, height: 4, mipmaps: false });
  });

  it('counts mipmaps for a canvas texture that generates them', () => {
    const canvas = document.createElement('canvas');
    canvas.width = 16;
    canvas.height = 16;
    expect(textureShapeOf(new CanvasTexture(canvas))).toMatchObject({ width: 16, mipmaps: true });
  });

  it('reads a compressed texture from its first mip level', () => {
    const mips = [
      { data: new Uint8Array(16), width: 64, height: 32 },
      { data: new Uint8Array(16), width: 32, height: 16 },
    ];
    const t = new CompressedTexture(mips, 64, 32, RGBA_BPTC_Format);
    expect(textureShapeOf(t)).toEqual({
      width: 64,
      height: 32,
      format: RGBA_BPTC_Format,
      type: t.type,
      mipmaps: true,
    });
  });

  it('gives zero size for a texture with no image yet', () => {
    expect(textureShapeOf(new Texture())).toMatchObject({ width: 0, height: 0 });
  });
});

describe('renderTargetBytes', () => {
  it('counts the colour buffer, times its samples', () => {
    const target = new WebGLRenderTarget(10, 10, { type: HalfFloatType });
    expect(renderTargetBytes(target)).toBe(10 * 10 * 8);
    target.samples = 4;
    expect(renderTargetBytes(target)).toBe(10 * 10 * 8 * 4);
  });
});

describe('collectTextureBytes', () => {
  it('adds each texture once, from material maps, shader uniforms and the background', () => {
    const scene = new Scene();
    const shared = data(4, 4); // 64 B
    const uniform = data(8, 8); // 256 B
    const background = data(2, 2); // 16 B
    scene.background = background;
    scene.add(new Mesh(new SphereGeometry(), new MeshStandardMaterial({ map: shared })));
    scene.add(
      new Mesh(
        new SphereGeometry(),
        new MeshStandardMaterial({ map: shared, emissiveMap: shared }),
      ),
    );
    scene.add(
      new Mesh(
        new SphereGeometry(),
        new ShaderMaterial({ uniforms: { uTex: { value: uniform } } }),
      ),
    );
    expect(collectTextureBytes(scene, [])).toBe(64 + 256 + 16);
  });

  it('adds render targets found in the extra roots, without counting their textures twice', () => {
    const scene = new Scene();
    const target = new WebGLRenderTarget(4, 4); // RGBA8: 64 B
    const pass = { buffer: target, nested: { other: new WebGLRenderTarget(2, 2) } }; // + 16 B
    scene.add(
      new Mesh(
        new SphereGeometry(),
        new ShaderMaterial({ uniforms: { t: { value: target.texture } } }),
      ),
    );
    expect(collectTextureBytes(scene, [{ inputBuffer: target, passes: [pass] }])).toBe(64 + 16);
  });
});

describe('countSceneGeometries', () => {
  it('counts each geometry the scene holds once', () => {
    const scene = new Scene();
    const shared = new SphereGeometry();
    scene.add(new Mesh(shared, new MeshStandardMaterial()));
    scene.add(new Mesh(shared, new MeshStandardMaterial()));
    scene.add(new Mesh(new SphereGeometry(), new MeshStandardMaterial()));
    expect(countSceneGeometries(scene)).toBe(2);
  });
});
