import type { Scene } from 'three';
import { createRolling } from '../../perf/rolling';
import { recordFrame, type PerfSnapshot } from '../../perf/snapshot';
import { collectTextureBytes, countSceneGeometries } from './collect';

/** The parts of `WebGLRenderer.info` the probe reads (with `autoReset` turned off). */
export interface RenderInfo {
  render: { calls: number; triangles: number };
  memory: { geometries: number; textures: number };
  reset: () => void;
}

const FPS_EVERY = 0.25;
const TEXTURES_EVERY = 0.5;

/**
 * Per-frame measurement for ?perf. Call `tick` first thing every frame: it records what the
 * previous whole frame drew (every post-processing pass included) and resets the counters.
 */
export function createProbe(
  snapshot: PerfSnapshot,
  info: RenderInfo,
  scene: Scene,
  roots: () => readonly unknown[],
) {
  const rolling = createRolling(5000);
  let sinceFps = 0;
  let sinceTextures = TEXTURES_EVERY;

  return {
    tick(delta: number): void {
      recordFrame(snapshot, info.render.calls, info.render.triangles);
      snapshot.geometries = info.memory.geometries;
      snapshot.textures = info.memory.textures;
      info.reset();

      rolling.push(delta * 1000);
      sinceFps += delta;
      if (sinceFps >= FPS_EVERY - 1e-9) {
        sinceFps = 0;
        snapshot.fps = rolling.fps();
        snapshot.frameMs = rolling.frameMs();
      }
      sinceTextures += delta;
      if (sinceTextures >= TEXTURES_EVERY - 1e-9) {
        sinceTextures = 0;
        snapshot.setTextureBytes(collectTextureBytes(scene, roots()));
        snapshot.sceneGeometries = countSceneGeometries(scene);
      }
    },
  };
}
