// Pure helpers for the bundle size check (scripts/bundle-size.mjs). No file system access here.

/**
 * @typedef {{ file: string, gzip: number }} ChunkSize
 * @typedef {{ file: string, key: string, gzip: number, budget: number | null, over: boolean }} Row
 */

/**
 * `vendor-3d-SyUaK-t0.js` → `vendor-3d`: the name before Vite's 8-character content hash.
 * @param {string} file
 * @returns {string}
 */
export function budgetKey(file) {
  return file.replace(/\.js$/, '').replace(/-[A-Za-z0-9_-]{8}$/, '');
}

/**
 * Compares each chunk's gzip size with its budget (bytes, keyed by chunk name).
 * @param {ChunkSize[]} sizes
 * @param {Record<string, number>} budgets
 * @returns {{ rows: Row[], failures: string[] }}
 */
export function checkSizes(sizes, budgets) {
  if (sizes.length === 0)
    return { rows: [], failures: ['no .js chunks found: run pnpm build first'] };
  /** @type {string[]} */
  const failures = [];
  const rows = sizes.map(({ file, gzip }) => {
    const key = budgetKey(file);
    const budget = Object.hasOwn(budgets, key) ? (budgets[key] ?? null) : null;
    if (budget === null) {
      failures.push(`${file} has no budget in scripts/bundle-budget.json (key "${key}")`);
    } else if (gzip > budget) {
      failures.push(`${file} is ${String(gzip)} B gzip, over its ${String(budget)} B budget`);
    }
    return { file, key, gzip, budget, over: budget === null || gzip > budget };
  });
  return { rows, failures };
}

const kb = (/** @type {number} */ bytes) => `${(bytes / 1000).toFixed(2)} kB`;

/** One aligned line per chunk: name, gzip size, budget, and ok/OVER. */
export function formatReport(/** @type {Row[]} */ rows) {
  const width = Math.max(...rows.map((r) => r.key.length));
  return rows
    .map(
      (r) =>
        `${r.key.padEnd(width)}  ${kb(r.gzip).padStart(10)} / ${(r.budget === null ? 'none' : kb(r.budget)).padStart(10)}  ${r.over ? 'OVER' : 'ok'}`,
    )
    .join('\n');
}
