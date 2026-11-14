import ReactThreeTestRenderer from '@react-three/test-renderer';
import { BufferGeometry, Material, type Mesh, type ShaderMaterial, Vector3 } from 'three';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { STOPS } from '../../content/journey';
import { buildRoute } from '../../journey/route';
import { CameraAt } from '../../test/CameraAt';
import { stubReducedMotion } from '../../test/reducedMotion';
import { Heliopause } from './Heliopause';
import { heliopauseLayout } from './heliosphere';

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

const route = buildRoute(STOPS);
const layout = heliopauseLayout(route);

type Renderer = Awaited<ReturnType<typeof ReactThreeTestRenderer.create>>;
const shell = (r: Renderer, name: string) => r.scene.instance.getObjectByName(name) as Mesh;
const uniform = (mesh: Mesh, name: string) =>
  (mesh.material as ShaderMaterial).uniforms[name]?.value as number;

async function at(z: number, frames = 2) {
  const renderer = await ReactThreeTestRenderer.create(
    <>
      <CameraAt z={z} />
      <Heliopause route={route} />
    </>,
  );
  await ReactThreeTestRenderer.act(async () => {
    await renderer.advanceFrames(frames, 1 / 30);
  });
  return renderer;
}

describe('Heliopause', () => {
  it('draws the heliopause and bow-shock shells at their centres and radii', async () => {
    const renderer = await at(layout.zStop);
    for (const [name, centre, radius] of [
      ['heliopause-shell', layout.helioCentre, layout.helioRadius],
      ['bow-shock-shell', layout.bowCentre, layout.bowRadius],
    ] as const) {
      const mesh = shell(renderer, name);
      expect(mesh, name).toBeDefined();
      expect((mesh.material as ShaderMaterial).fragmentShader).toContain('fbm3(');
      expect(mesh.position.toArray()).toEqual(centre);
      expect(mesh.scale.x).toBe(radius);
      // The cap's nose (local +Y pole) faces the approaching camera and sits on the path.
      mesh.updateMatrixWorld();
      const nose = new Vector3(0, 1, 0).applyMatrix4(mesh.matrixWorld);
      expect(nose.z).toBeCloseTo(centre[2] + radius, 6);
      expect(Math.hypot(nose.x, nose.y)).toBeCloseTo(0, 6);
    }
    await renderer.unmount();
  });

  it('is hidden while the camera is far from the crossing', async () => {
    const renderer = await at(layout.zCross + 3000);
    expect(renderer.scene.instance.getObjectByName('heliopause')?.visible).toBe(false);
    await renderer.unmount();
  });

  it('brightens the heliopause shell as the camera crosses it', async () => {
    stubReducedMotion(false);
    const crossing = await at(layout.zCross);
    expect(uniform(shell(crossing, 'heliopause-shell'), 'uCross')).toBeCloseTo(1);
    expect(crossing.scene.instance.getObjectByName('heliopause')?.visible).toBe(true);
    await crossing.unmount();
    const parked = await at(layout.zStop);
    expect(uniform(shell(parked, 'heliopause-shell'), 'uCross')).toBe(0);
    await parked.unmount();
  });

  it('ripples over time', async () => {
    stubReducedMotion(false);
    const renderer = await at(layout.zStop, 10);
    expect(uniform(shell(renderer, 'bow-shock-shell'), 'uTime')).toBeGreaterThan(0);
    await renderer.unmount();
  });

  it('holds still and never brightens under reduced motion', async () => {
    stubReducedMotion(true);
    const renderer = await at(layout.zCross, 10);
    expect(uniform(shell(renderer, 'heliopause-shell'), 'uCross')).toBe(0);
    expect(uniform(shell(renderer, 'heliopause-shell'), 'uTime')).toBe(0);
    expect(uniform(shell(renderer, 'bow-shock-shell'), 'uTime')).toBe(0);
    await renderer.unmount();
  });

  it('disposes the geometry and materials it creates', async () => {
    const geometrySpy = vi.spyOn(BufferGeometry.prototype, 'dispose');
    const materialSpy = vi.spyOn(Material.prototype, 'dispose');
    const renderer = await at(layout.zStop);
    const meshes = ['heliopause-shell', 'bow-shock-shell'].map((n) => shell(renderer, n));
    await renderer.unmount();
    for (const mesh of meshes) {
      expect(geometrySpy.mock.contexts).toContain(mesh.geometry);
      expect(materialSpy.mock.contexts).toContain(mesh.material);
    }
  });
});
