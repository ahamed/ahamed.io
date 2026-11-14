import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test } from '@playwright/test';
import { begin } from './begin.js';

const ASSETS = join(import.meta.dirname, '..', 'dist', 'assets');
/** A string literal only Inspect.tsx contains; identifiers get minified, literals do not. */
const INSPECT_MARKER = 'Voyager 1 inspector';

test.describe('dev-only inspector', () => {
  test('?inspect is ignored in production: the normal voyage shows', async ({ page }) => {
    await page.goto('/?inspect');
    await begin(page);
    await expect(page.locator('[data-stop="earth"]')).toHaveAttribute('data-state', 'open', {
      timeout: 15_000,
    });
    await expect(page.getByLabel(INSPECT_MARKER)).toHaveCount(0);
  });

  test('the production bundle does not contain the inspector', () => {
    const scripts = readdirSync(ASSETS).filter((file) => file.endsWith('.js'));
    expect(scripts.length).toBeGreaterThan(0);
    for (const file of scripts) {
      expect(file).not.toMatch(/^Inspect/);
      expect(readFileSync(join(ASSETS, file), 'utf8'), file).not.toContain(INSPECT_MARKER);
    }
  });
});
