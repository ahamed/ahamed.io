import { DataTexture, Mesh, MeshBasicMaterial, RGBAFormat, Scene, SphereGeometry } from 'three';
import { describe, expect, it } from 'vitest';
import { createSnapshot } from '../../perf/snapshot';
import { createProbe, type RenderInfo } from './probe';

function fakeInfo(): RenderInfo & { resets: number } {
  const info = {
    render: { calls: 0, triangles: 0 },
    memory: { geometries: 0, textures: 0 },
    resets: 0,
    reset() {
      info.resets++;
      info.render.calls = 0;
      info.render.triangles = 0;
    },
  };
  return info;
}

describe('createProbe', () => {
  it('records the whole previous frame, then resets the counters', () => {
    const snapshot = createSnapshot('high');
    const info = fakeInfo();
    const probe = createProbe(snapshot, info, new Scene(), () => []);
    info.render.calls = 12;
    info.render.triangles = 3000;
    info.memory.geometries = 5;
    info.memory.textures = 7;
    probe.tick(1 / 60);
    expect(snapshot).toMatchObject({ calls: 12, triangles: 3000, geometries: 5, textures: 7 });
    expect(info.resets).toBe(1);
    expect(info.render.calls).toBe(0);
  });

  it('updates FPS and frame time every quarter second', () => {
    const snapshot = createSnapshot('high');
    const probe = createProbe(snapshot, fakeInfo(), new Scene(), () => []);
    for (let i = 0; i < 10; i++) probe.tick(0.02);
    expect(snapshot.fps).toBe(0);
    for (let i = 0; i < 10; i++) probe.tick(0.02);
    expect(snapshot.fps).toBeCloseTo(50);
    expect(snapshot.frameMs).toBeCloseTo(20);
  });

  it('estimates texture memory every half second, and on the first frame', () => {
    const snapshot = createSnapshot('high');
    const scene = new Scene();
    const probe = createProbe(snapshot, fakeInfo(), scene, () => []);
    probe.tick(0.01);
    expect(snapshot.textureBytes).toBe(0);
    const map = new DataTexture(new Uint8Array(64), 4, 4, RGBAFormat);
    scene.add(new Mesh(new SphereGeometry(), new MeshBasicMaterial({ map })));
    probe.tick(0.2);
    expect(snapshot.textureBytes).toBe(0);
    probe.tick(0.4);
    expect(snapshot.textureBytes).toBe(64);
    expect(snapshot.sceneGeometries).toBe(1);
  });
});
