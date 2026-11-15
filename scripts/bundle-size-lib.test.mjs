// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { budgetKey, checkSizes, formatReport } from './bundle-size-lib.mjs';

const BUDGETS = { index: 90_000, Voyage: 40_000, 'vendor-3d': 320_000 };

describe('budgetKey', () => {
  it('strips the content hash and extension', () => {
    expect(budgetKey('index-DQEyDq6T.js')).toBe('index');
    expect(budgetKey('vendor-3d-SyUaK-t0.js')).toBe('vendor-3d');
    expect(budgetKey('jsx-runtime-Wy9s6hX0.js')).toBe('jsx-runtime');
    expect(budgetKey('Voyage-B2zFKBri.js')).toBe('Voyage');
  });
});

describe('checkSizes', () => {
  it('passes chunks at or under their budget', () => {
    const result = checkSizes([{ file: 'index-abcdefgh.js', gzip: 90_000 }], BUDGETS);
    expect(result.failures).toEqual([]);
    expect(result.rows).toEqual([
      { file: 'index-abcdefgh.js', key: 'index', gzip: 90_000, budget: 90_000, over: false },
    ]);
  });

  it('fails a chunk over its budget, naming it with its size and budget', () => {
    const result = checkSizes([{ file: 'Voyage-abcdefgh.js', gzip: 40_001 }], BUDGETS);
    expect(result.failures).toEqual([
      'Voyage-abcdefgh.js is 40001 B gzip, over its 40000 B budget',
    ]);
  });

  it('fails a chunk that has no budget', () => {
    const result = checkSizes([{ file: 'Mystery-abcdefgh.js', gzip: 10 }], BUDGETS);
    expect(result.failures).toEqual([
      'Mystery-abcdefgh.js has no budget in scripts/bundle-budget.json (key "Mystery")',
    ]);
  });

  it('fails when there are no chunks at all (no build)', () => {
    expect(checkSizes([], BUDGETS).failures).toEqual(['no .js chunks found: run pnpm build first']);
  });
});

describe('formatReport', () => {
  it('prints one line per chunk with its gzip size and budget in kB', () => {
    const { rows } = checkSizes(
      [
        { file: 'index-abcdefgh.js', gzip: 82_450 },
        { file: 'Voyage-abcdefgh.js', gzip: 50_000 },
      ],
      BUDGETS,
    );
    const report = formatReport(rows);
    expect(report).toContain('index');
    expect(report).toMatch(/index\s+82\.45 kB\s+\/\s+90\.00 kB\s+ok/);
    expect(report).toMatch(/Voyage\s+50\.00 kB\s+\/\s+40\.00 kB\s+OVER/);
  });
});
