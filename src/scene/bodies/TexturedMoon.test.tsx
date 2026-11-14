import ReactThreeTestRenderer from '@react-three/test-renderer';
import { Color, Material, Mesh, MeshStandardMaterial, ShaderMaterial, Texture } from 'three';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MOON_PRESETS, type MoonPresetId } from './moonPresets';
import { TexturedMoon } from './TexturedMoon';

const textures: Record<string, Texture> = {};
const requested: string[][] = [];

vi.mock('../ktx2', () => ({
  useKtx2: (names: string[]) => {
    requested.push(names);
    return names.map((n) => (textures[n] ??= new Texture()));
  },
}));

afterEach(() => {
  vi.restoreAllMocks();
});

describe('TexturedMoon orientation', () => {
  it('turns Pluto by its preset yaw, then tilts it by its preset pitch', async () => {
    const renderer = await ReactThreeTestRenderer.create(
      <TexturedMoon preset="pluto" radius={2.6} />,
    );
    const surface = renderer.scene.instance.getObjectByName('moon-pluto') as Mesh;
    expect(surface.rotation.y).toBeCloseTo(MOON_PRESETS.pluto.yaw ?? NaN, 9);
    expect(surface.parent?.rotation.x).toBeCloseTo(MOON_PRESETS.pluto.pitch ?? NaN, 9);
    await renderer.unmount();
  });
});

const MOONS: MoonPresetId[] = [
  'io',
  'europa',
  'ganymede',
  'callisto',
  'titan',
  'rhea',
  'iapetus',
  'enceladus',
  'pluto',
  'charon',
];

describe('TexturedMoon', () => {
  it('has a preset for each of the eight gas-giant moons', () => {
    expect(Object.keys(MOON_PRESETS).sort()).toEqual([...MOONS].sort());
  });

  it.each(MOONS)('maps the 1K %s texture onto a sphere of the given radius', async (id) => {
    const renderer = await ReactThreeTestRenderer.create(<TexturedMoon preset={id} radius={1.5} />);
    expect(requested).toContainEqual([`1k_${id}`]);
    const surface = renderer.scene.instance.getObjectByName(`moon-${id}`) as Mesh;
    expect((surface.material as MeshStandardMaterial).map).toBe(textures[`1k_${id}`]);
    surface.geometry.computeBoundingSphere();
    expect(surface.geometry.boundingSphere?.radius).toBeCloseTo(1.5, 3);
    await renderer.unmount();
  });

  it('wraps Titan, and only Titan, in an orange haze rim', async () => {
    const titan = await ReactThreeTestRenderer.create(<TexturedMoon preset="titan" radius={2} />);
    const haze = titan.scene.instance.getObjectByName('moon-titan-haze') as Mesh;
    const color = ((haze.material as ShaderMaterial).uniforms.uColor?.value as Color).clone();
    expect(color.r).toBeGreaterThan(color.g);
    expect(color.g).toBeGreaterThan(color.b);
    await titan.unmount();
    const io = await ReactThreeTestRenderer.create(<TexturedMoon preset="io" radius={2} />);
    expect(io.scene.instance.getObjectByName('moon-io-haze')).toBeUndefined();
    await io.unmount();
  });

  it('is hidden when it would be only a few pixels across', async () => {
    const renderer = await ReactThreeTestRenderer.create(
      <group position={[0, 0, -1_000_000]}>
        <TexturedMoon preset="rhea" radius={1} />
      </group>,
    );
    await ReactThreeTestRenderer.act(async () => {
      await renderer.advanceFrames(1, 1 / 60);
    });
    expect(renderer.scene.instance.getObjectByName('moon-rhea-root')?.visible).toBe(false);
    await renderer.unmount();
  });

  it('disposes its materials on unmount', async () => {
    const spy = vi.spyOn(Material.prototype, 'dispose');
    const renderer = await ReactThreeTestRenderer.create(
      <TexturedMoon preset="titan" radius={2} />,
    );
    // Read before unmount: detaching puts the mesh's default material back.
    const surface = (renderer.scene.instance.getObjectByName('moon-titan') as Mesh).material;
    const haze = (renderer.scene.instance.getObjectByName('moon-titan-haze') as Mesh).material;
    await renderer.unmount();
    expect(spy.mock.contexts).toContain(surface);
    expect(spy.mock.contexts).toContain(haze);
  });
});
