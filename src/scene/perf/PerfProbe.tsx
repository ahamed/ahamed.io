import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo } from 'react';
import { useStore } from 'zustand';
import type { PerfSnapshot } from '../../perf/snapshot';
import type { Tier } from '../quality/profile';
import { qualityStore, type QualityStore } from '../quality/store';
import { createProbe } from './probe';
import { listRoots } from './roots';

/** Runs before every other frame callback, so it sees the previous frame's full totals. */
const FIRST = -1000;

/** Counts whole frames (every render pass) by resetting `info` itself; undone by the return. */
function attach(info: { autoReset: boolean }, snapshot: PerfSnapshot): () => void {
  const autoReset = info.autoReset;
  info.autoReset = false;
  window.__voyagePerf = snapshot;
  return () => {
    info.autoReset = autoReset;
    delete window.__voyagePerf;
  };
}

function setTier(snapshot: PerfSnapshot, tier: Tier): void {
  snapshot.tier = tier;
}

interface Props {
  snapshot: PerfSnapshot;
  store?: QualityStore;
}

/**
 * ?perf only: measures draw calls, triangles, live GPU objects, texture memory and the frame
 * rate into `snapshot`, and exposes it as `window.__voyagePerf`.
 */
export function PerfProbe({ snapshot, store = qualityStore }: Props) {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const tier = useStore(store, (s) => s.tier);
  const probe = useMemo(
    () => createProbe(snapshot, gl.info, scene, listRoots),
    [snapshot, gl, scene],
  );

  useEffect(() => attach(gl.info, snapshot), [gl, snapshot]);

  useEffect(() => {
    setTier(snapshot, tier);
  }, [snapshot, tier]);

  useFrame((_, delta) => {
    probe.tick(delta);
  }, FIRST);

  return null;
}
