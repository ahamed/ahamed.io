import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test } from '@playwright/test';
import { begin } from './begin.js';

const ROOT = join(import.meta.dirname, '..');
/** Card titles in route order, as they appear in Text mode. */
const TITLES = [
  'Hello, I’m Sajeeb',
  'Career timeline',
  'Products & platforms',
  'Open-source libraries',
  'Tech stack',
  'Leadership',
];

test.describe('Text mode', () => {
  test('?text shows every card without loading the 3D scene', async ({ page }) => {
    const requests: string[] = [];
    page.on('request', (r) => requests.push(new URL(r.url()).pathname));
    await page.goto('/?text', { waitUntil: 'networkidle' });
    await expect(page.getByRole('article')).toHaveCount(26);
    for (const title of TITLES) {
      await expect(page.getByRole('heading', { name: title, exact: true })).toBeVisible();
    }
    await expect(page.getByRole('region', { name: 'Open a channel' })).toBeVisible();
    await expect(page.locator('canvas')).toHaveCount(0);
    expect(requests.filter((p) => /\.ktx2$|Voyage-/.test(p))).toEqual([]);
  });

  test('scrolls on a phone without sideways overflow', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/?text');
    await page.getByRole('heading', { name: 'Leadership', exact: true }).scrollIntoViewIfNeeded();
    await expect(page.getByRole('heading', { name: 'Leadership', exact: true })).toBeInViewport();
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });

  test('the boot panel and the HUD link to Text mode, and it links back', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: 'Read as text' }).click();
    await expect(page).toHaveURL(/\?text$/);
    await page.getByRole('link', { name: 'Back to the voyage' }).click();
    await begin(page);
    await page
      .getByRole('group', { name: 'Voyage controls' })
      .getByRole('link', { name: 'Text mode' })
      .click();
    await expect(page.getByRole('heading', { name: 'Career timeline', exact: true })).toBeVisible();
  });

  test('in the voyage, a skip link comes first and every card is in the accessibility tree', async ({
    page,
  }) => {
    await page.goto('/');
    // Wait for the app to replace the prerendered page before tabbing.
    await page.getByRole('dialog', { name: 'Mission boot' }).waitFor();
    await page.keyboard.press('Tab');
    const skip = page.getByRole('link', { name: 'Skip to text version' });
    await expect(skip).toBeFocused();
    await expect(skip).toBeInViewport();
    const tree = await page.locator('#text-version').locator('..').ariaSnapshot();
    for (const title of TITLES) expect(tree).toContain(title);
  });
});

test.describe('SEO', () => {
  test('the built page carries every card before JavaScript runs', () => {
    const html = readFileSync(join(ROOT, 'dist', 'index.html'), 'utf8');
    for (const title of ['Career timeline', 'Products &amp; platforms', 'Leadership']) {
      expect(html).toContain(title);
    }
    expect(html).toContain('href="https://github.com/ahamed"');
  });

  test('link-preview tags point at a 1200 × 630 share image', async ({ page }) => {
    await page.goto('/');
    const content = (key: string) =>
      page.locator(`meta[property="${key}"], meta[name="${key}"]`).getAttribute('content');
    expect(await content('og:image')).toBe('https://ahamed.io/og.png');
    expect(await content('twitter:card')).toBe('summary_large_image');
    const png = readFileSync(join(ROOT, 'public', 'og.png'));
    expect(png.subarray(1, 4).toString()).toBe('PNG');
    expect(png.readUInt32BE(16)).toBe(1200);
    expect(png.readUInt32BE(20)).toBe(630);
    const served = await page.request.get('/og.png');
    expect(served.ok()).toBe(true);
  });
});
