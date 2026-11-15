import { expect, test, type Page } from '@playwright/test';
import { begin } from './begin.js';

const OPEN = { timeout: 15_000 };

function textures(page: Page): string[] {
  const requested: string[] = [];
  page.on('request', (request) => {
    const path = new URL(request.url()).pathname;
    if (path.endsWith('.ktx2')) requested.push(path.split('/').pop() ?? path);
  });
  return requested;
}

test.describe('quality tiers', () => {
  test('?quality=low loads only 1K maps, stays low and runs without errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (m) => {
      if (m.type() === 'error') errors.push(m.text());
    });
    page.on('pageerror', (e) => errors.push(e.message));
    const requested = textures(page);

    await page.goto('/?quality=low');
    await begin(page);
    await expect(page.locator('[data-stop="earth"]')).toHaveAttribute('data-state', 'open', OPEN);
    await expect(page.locator('canvas')).toHaveAttribute('data-quality', 'low');

    expect(requested.length).toBeGreaterThan(0);
    expect(requested.filter((name) => !name.startsWith('1k_'))).toEqual([]);
    expect(requested).toContain('1k_earth_daymap.ktx2');
    expect(errors).toEqual([]);
  });

  test('a desktop starts at high and loads the 2K maps', async ({ page }) => {
    const requested = textures(page);
    await page.goto('/');
    // Read before Begin: the frame-rate monitor only starts after it.
    await expect(page.locator('canvas')).toHaveAttribute('data-quality', 'high', OPEN);
    await begin(page);
    await expect(page.locator('[data-stop="earth"]')).toHaveAttribute('data-state', 'open', OPEN);
    expect(requested).toContain('2k_earth_daymap.ktx2');
    expect(requested).not.toContain('1k_earth_daymap.ktx2');
  });

  test('?quality=high stays high after Begin, even on a slow renderer', async ({ page }) => {
    await page.goto('/?quality=high');
    await begin(page);
    await page.waitForTimeout(4000);
    await expect(page.locator('canvas')).toHaveAttribute('data-quality', 'high');
  });
});
