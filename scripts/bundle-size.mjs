// `pnpm size`: gzips every built JS chunk and fails when one exceeds its budget in
// scripts/bundle-budget.json. Run after `pnpm build`.
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';
import { checkSizes, formatReport } from './bundle-size-lib.mjs';

const root = join(import.meta.dirname, '..');
const assets = join(root, 'dist', 'assets');

/** @returns {Record<string, number>} Gzip budget in bytes per chunk name. */
function readBudgets() {
  /** @type {unknown} */
  const raw = JSON.parse(readFileSync(join(import.meta.dirname, 'bundle-budget.json'), 'utf8'));
  if (typeof raw !== 'object' || raw === null) throw new Error('bundle-budget.json: not an object');
  /** @type {Record<string, number>} */
  const budgets = {};
  for (const [key, value] of Object.entries(raw)) {
    if (typeof value !== 'number') throw new Error(`bundle-budget.json: "${key}" is not a number`);
    budgets[key] = value;
  }
  return budgets;
}

const budgets = readBudgets();

/** @type {string[]} */
let files = [];
try {
  files = readdirSync(assets).filter((file) => file.endsWith('.js'));
} catch {
  // No build yet: checkSizes reports it.
}
const sizes = files.sort().map((file) => ({
  file,
  gzip: gzipSync(readFileSync(join(assets, file)), { level: 9 }).length,
}));

const { rows, failures } = checkSizes(sizes, budgets);
if (rows.length > 0) console.log(formatReport(rows));
if (failures.length > 0) {
  for (const failure of failures) console.error(`✖ ${failure}`);
  process.exit(1);
}
