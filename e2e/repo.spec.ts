import { execFileSync, spawnSync } from 'node:child_process';
import { join } from 'node:path';
import { expect, test } from '@playwright/test';

const ROOT = join(import.meta.dirname, '..');

/** True when git's ignore rules match `path` (exit 0), false when they don't (exit 1). */
function isIgnored(path: string): boolean {
  try {
    execFileSync('git', ['check-ignore', '-q', path], { cwd: ROOT });
    return true;
  } catch {
    return false;
  }
}

test.describe('repository hygiene', () => {
  test('the private profile notes (data.md) are ignored by git', () => {
    expect(isIgnored('data.md')).toBe(true);
  });

  test('pnpm textures is a no-op on a clean checkout, even without toktx', () => {
    // A PATH without toktx: the committed .ktx2 files must match their lock, so nothing encodes.
    const result = spawnSync(process.execPath, ['scripts/textures.mjs'], {
      cwd: ROOT,
      env: { ...process.env, PATH: '/usr/bin:/bin' },
      encoding: 'utf8',
    });
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('textures are up to date');
  });
});
