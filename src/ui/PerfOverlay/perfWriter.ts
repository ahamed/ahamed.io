import { overBudget, type BudgetMetric } from '../../perf/budget';
import type { PerfSnapshot } from '../../perf/snapshot';

export const PERF_ROWS = [
  'fps',
  'frame',
  'calls',
  'triangles',
  'geometries',
  'textures',
  'textureMb',
  'tier',
] as const;
export type PerfRow = (typeof PERF_ROWS)[number];

/** Which row shows each budgeted metric. */
const BUDGET_ROWS: Record<BudgetMetric, PerfRow> = {
  calls: 'calls',
  triangles: 'triangles',
  textureBytes: 'textureMb',
};

const MB = 1024 * 1024;
const count = new Intl.NumberFormat('en-US');

function values(s: PerfSnapshot): Record<PerfRow, string> {
  return {
    fps: s.fps.toFixed(1),
    frame: `${s.frameMs.toFixed(1)} ms`,
    calls: count.format(s.calls),
    triangles: count.format(s.triangles),
    geometries: count.format(s.geometries),
    textures: count.format(s.textures),
    textureMb: `${(s.textureBytes / MB).toFixed(1)} MB`,
    tier: s.tier,
  };
}

/** Writes the snapshot into the overlay's value cells, marking values over the tier budget. */
export function createPerfWriter(targets: Record<PerfRow, HTMLElement>) {
  return (snapshot: PerfSnapshot | undefined): void => {
    const shown = snapshot ? values(snapshot) : null;
    const over = new Set(snapshot ? overBudget(snapshot, snapshot.tier) : []);
    for (const row of PERF_ROWS) {
      const cell = targets[row];
      cell.textContent = shown ? shown[row] : '–';
      cell.removeAttribute('data-over');
    }
    for (const metric of over) {
      const cell = targets[BUDGET_ROWS[metric]];
      cell.setAttribute('data-over', '');
      const label = document.createElement('span');
      label.className = 'visually-hidden';
      label.textContent = ' over budget';
      cell.append(label);
    }
  };
}
