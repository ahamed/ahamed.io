import ReactThreeTestRenderer from '@react-three/test-renderer';
import { BackSide, Mesh, MeshBasicMaterial, Quaternion, SRGBColorSpace, Texture } from 'three';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { skyQuaternion } from './orientation';
import { MILKY_WAY_URL, Sky } from './Sky';

const texture = new Texture();
const clear = vi.fn();

vi.mock('@react-three/drei', () => ({
  useTexture: Object.assign(
    (url: string, onLoad?: (t: Texture) => void) => {
      if (url !== MILKY_WAY_URL) throw new Error(`unexpected texture ${url}`);
      onLoad?.(texture);
      return texture;
    },
    {
      clear: (url: string) => {
        clear(url);
      },
    },
  ),
}));

afterEach(() => {
  clear.mockClear();
});

async function renderSky() {
  const renderer = await ReactThreeTestRenderer.create(<Sky />);
  const sky = renderer.scene.instance.getObjectByName('sky');
  if (!(sky instanceof Mesh)) throw new Error('no sky mesh');
  return { renderer, sky: sky as Mesh };
}

describe('Sky', () => {
  it('draws the Milky Way texture on the inside of a sphere, first and without depth writes', async () => {
    const { renderer, sky } = await renderSky();
    const material = sky.material as MeshBasicMaterial;
    expect(material).toBeInstanceOf(MeshBasicMaterial);
    expect(material.map).toBe(texture);
    expect(texture.colorSpace).toBe(SRGBColorSpace);
    expect(material.side).toBe(BackSide);
    expect(material.depthWrite).toBe(false);
    expect(material.toneMapped).toBe(false);
    expect(sky.frustumCulled).toBe(false);
    expect(sky.renderOrder).toBeLessThan(0);
    await renderer.unmount();
  });

  it("is rotated so travel points at Voyager 1's heading", async () => {
    const { renderer, sky } = await renderSky();
    expect(sky.quaternion.angleTo(new Quaternion(...skyQuaternion()))).toBeLessThan(1e-6);
    await renderer.unmount();
  });

  it('releases the texture on unmount', async () => {
    const dispose = vi.spyOn(texture, 'dispose');
    const { renderer } = await renderSky();
    await renderer.unmount();
    expect(dispose).toHaveBeenCalled();
    expect(clear).toHaveBeenCalledWith(MILKY_WAY_URL);
  });
});
