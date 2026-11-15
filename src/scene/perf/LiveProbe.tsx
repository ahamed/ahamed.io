import { useState } from 'react';
import { createSnapshot } from '../../perf/snapshot';
import { qualityStore } from '../quality/store';
import { PerfProbe } from './PerfProbe';

/** ?perf only: the probe with its own snapshot. Default export, so it is its own lazy chunk. */
export default function LiveProbe() {
  const [snapshot] = useState(() => createSnapshot(qualityStore.getState().tier));
  return <PerfProbe snapshot={snapshot} />;
}
