import ReactThreeTestRenderer from '@react-three/test-renderer';
import type { ReactElement } from 'react';
import {
  BufferGeometry,
  Material,
  Texture,
  WebGLRenderTarget,
  type Object3D,
  type Scene,
} from 'three';
import { vi } from 'vitest';

type Resource = BufferGeometry | Material | Texture;

const isTexture = (v: unknown): v is Texture => v instanceof Texture;

/** Every geometry, material and texture (maps and shader uniforms) the scene holds. */
function gather(scene: Scene): Set<Resource> {
  const found = new Set<Resource>();
  const addMaterial = (material: Material) => {
    found.add(material);
    for (const value of Object.values(material)) if (isTexture(value)) found.add(value);
    const uniforms = (material as { uniforms?: Record<string, { value: unknown }> }).uniforms;
    for (const uniform of Object.values(uniforms ?? {})) {
      if (isTexture(uniform.value)) found.add(uniform.value);
    }
  };
  if (isTexture(scene.environment)) found.add(scene.environment);
  scene.traverse((object: Object3D) => {
    const { geometry, material } = object as { geometry?: unknown; material?: unknown };
    if (geometry instanceof BufferGeometry) found.add(geometry);
    if (Array.isArray(material)) for (const m of material as Material[]) addMaterial(m);
    else if (material instanceof Material) addMaterial(material as Material);
  });
  return found;
}

const describeResource = (r: Resource) =>
  `${r.constructor.name}${'name' in r && r.name ? ` "${r.name}"` : ''}`;

/**
 * Mounts `element`, runs a few frames, unmounts it, and reports how many GPU resources it held
 * and which of them were never disposed. `keep` excludes resources owned elsewhere (e.g. the shared KTX2 cache).
 */
export async function undisposedAfterUnmount(
  element: ReactElement,
  keep: (resource: Resource) => boolean = () => false,
): Promise<{ held: number; left: string[] }> {
  const disposed = new Set<unknown>();
  const record = function (this: unknown) {
    disposed.add(this);
  };
  const spies = [
    vi.spyOn(BufferGeometry.prototype, 'dispose').mockImplementation(record),
    vi.spyOn(Material.prototype, 'dispose').mockImplementation(record),
    vi.spyOn(Texture.prototype, 'dispose').mockImplementation(record),
    vi.spyOn(WebGLRenderTarget.prototype, 'dispose').mockImplementation(function (
      this: WebGLRenderTarget,
    ) {
      disposed.add(this);
      disposed.add(this.texture);
    }),
  ];
  try {
    const renderer = await ReactThreeTestRenderer.create(element);
    await ReactThreeTestRenderer.act(async () => {
      await renderer.advanceFrames(3, 1 / 60);
    });
    const held = gather(renderer.scene.instance as unknown as Scene);
    await renderer.unmount();
    const own = [...held].filter((r) => !keep(r));
    return { held: own.length, left: own.filter((r) => !disposed.has(r)).map(describeResource) };
  } finally {
    for (const spy of spies) spy.mockRestore();
  }
}
