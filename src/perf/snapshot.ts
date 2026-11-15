import type { Tier } from '../scene/quality/profile';
import type { Budget } from './budget';

/** The live numbers behind the ?perf overlay, also exposed as `window.__voyagePerf`. */
export interface PerfSnapshot {
  /** 5-second rolling average. */
  fps: number;
  frameMs: number;
  /** Totals over the last whole frame, every render pass included. */
  calls: number;
  triangles: number;
  /** Live GPU objects. */
  geometries: number;
  textures: number;
  /** Distinct geometries in the scene graph: live GPU geometries beyond this have leaked. */
  sceneGeometries: number;
  /** Estimated texture memory, render targets included. */
  textureBytes: number;
  tier: Tier;
  /** Highest values since the last `resetPeaks()`. */
  peak: Budget;
  resetPeaks: () => void;
  setTextureBytes: (bytes: number) => void;
}

export function createSnapshot(tier: Tier): PerfSnapshot {
  const snapshot: PerfSnapshot = {
    fps: 0,
    frameMs: 0,
    calls: 0,
    triangles: 0,
    geometries: 0,
    textures: 0,
    sceneGeometries: 0,
    textureBytes: 0,
    tier,
    peak: { calls: 0, triangles: 0, textureBytes: 0 },
    resetPeaks: () => {
      snapshot.peak.calls = snapshot.calls;
      snapshot.peak.triangles = snapshot.triangles;
      snapshot.peak.textureBytes = snapshot.textureBytes;
    },
    setTextureBytes: (bytes) => {
      snapshot.textureBytes = bytes;
      snapshot.peak.textureBytes = Math.max(snapshot.peak.textureBytes, bytes);
    },
  };
  return snapshot;
}

/** Writes one frame's totals and raises the peaks. */
export function recordFrame(snapshot: PerfSnapshot, calls: number, triangles: number): void {
  snapshot.calls = calls;
  snapshot.triangles = triangles;
  snapshot.peak.calls = Math.max(snapshot.peak.calls, calls);
  snapshot.peak.triangles = Math.max(snapshot.peak.triangles, triangles);
}

declare global {
  interface Window {
    /** Set only with ?perf, for the E2E budget gate and manual checks. */
    __voyagePerf?: PerfSnapshot;
  }
}
