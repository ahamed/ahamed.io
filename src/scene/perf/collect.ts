import type { Material, Object3D, Scene, Texture, WebGLRenderTarget } from 'three';
import { textureBytes, type TextureShape } from '../../perf/textureBytes';

/** three's mipmap minification filters (Nearest/Linear MipmapNearest/Linear). */
const MIPMAP_FILTERS = new Set([1004, 1005, 1007, 1008]);

interface Sized {
  width?: number;
  height?: number;
}

const isTexture = (value: unknown): value is Texture =>
  typeof value === 'object' &&
  value !== null &&
  (value as { isTexture?: boolean }).isTexture === true;

const isRenderTarget = (value: unknown): value is WebGLRenderTarget =>
  typeof value === 'object' &&
  value !== null &&
  (value as { isRenderTarget?: boolean }).isRenderTarget === true;

/** Size, format and mip chain of a texture, as the GPU holds it. */
export function textureShapeOf(texture: Texture): TextureShape {
  const mips = texture.mipmaps as Sized[] | undefined;
  const first = mips?.[0];
  if ((texture as { isCompressedTexture?: boolean }).isCompressedTexture === true && first) {
    return {
      width: first.width ?? 0,
      height: first.height ?? 0,
      format: texture.format,
      type: texture.type,
      mipmaps: mips.length > 1,
    };
  }
  const image = texture.image as Sized | null | undefined;
  return {
    width: image?.width ?? 0,
    height: image?.height ?? 0,
    format: texture.format,
    type: texture.type,
    mipmaps:
      (mips?.length ?? 0) > 1 || (texture.generateMipmaps && MIPMAP_FILTERS.has(texture.minFilter)),
  };
}

/** A render target's colour buffer, once per MSAA sample. */
export function renderTargetBytes(target: WebGLRenderTarget): number {
  const shape = textureShapeOf(target.texture);
  const bytes = textureBytes({ ...shape, width: target.width, height: target.height });
  return bytes * Math.max(1, target.samples);
}

// Reused between calls: the walk runs every 500 ms in ?perf mode only.
const textures = new Set<Texture>();
const targets = new Set<WebGLRenderTarget>();
const visited = new Set<object>();

/** Finds render targets inside `value` (a composer, its passes and their buffers). */
function findTargets(value: unknown, depth: number): void {
  if (typeof value !== 'object' || value === null || visited.has(value) || depth > 4) return;
  visited.add(value);
  if (isRenderTarget(value)) {
    targets.add(value);
    return;
  }
  if (isTexture(value)) return;
  const entries = Array.isArray(value) ? value : Object.values(value as Record<string, unknown>);
  for (const entry of entries) findTargets(entry, depth + 1);
}

function addMaterial(material: Material): void {
  for (const value of Object.values(material as unknown as Record<string, unknown>)) {
    if (isTexture(value)) textures.add(value);
  }
  const uniforms = (material as { uniforms?: Record<string, { value: unknown }> }).uniforms;
  if (!uniforms) return;
  for (const uniform of Object.values(uniforms)) {
    const value = uniform.value;
    if (isTexture(value)) textures.add(value);
    else if (Array.isArray(value)) for (const v of value) if (isTexture(v)) textures.add(v);
  }
}

/**
 * Estimated GPU texture memory: every texture the scene's materials, background and
 * environment use, plus the render targets found in `roots` (e.g. the post-processing
 * composer). A render target's texture is counted once, as the target.
 */
export function collectTextureBytes(scene: Scene, roots: readonly unknown[]): number {
  textures.clear();
  targets.clear();
  visited.clear();
  for (const root of roots) findTargets(root, 0);

  if (isTexture(scene.background)) textures.add(scene.background);
  if (isTexture(scene.environment)) textures.add(scene.environment);
  scene.traverse((object: Object3D) => {
    const material = (object as { material?: Material | Material[] }).material;
    if (Array.isArray(material)) material.forEach(addMaterial);
    else if (material) addMaterial(material);
  });

  let bytes = 0;
  for (const target of targets) {
    bytes += renderTargetBytes(target);
    textures.delete(target.texture);
  }
  for (const texture of textures) bytes += textureBytes(textureShapeOf(texture));
  return bytes;
}

const geometries = new Set<unknown>();

/** Distinct geometries in the scene graph (shared ones once). */
export function countSceneGeometries(scene: Scene): number {
  geometries.clear();
  scene.traverse((object: Object3D) => {
    const { geometry } = object as { geometry?: unknown };
    if (geometry) geometries.add(geometry);
  });
  return geometries.size;
}
