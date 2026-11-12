import { expect, test } from '@playwright/test';

test.describe('app shell', () => {
  test('loads cleanly with metadata, landmark and background', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text());
    });
    page.on('pageerror', (error) => {
      errors.push(error.message);
    });

    await page.goto('/', { waitUntil: 'networkidle' });

    await expect(page).toHaveTitle('Sajeeb Ahamed · ahamed.io');
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.getByRole('main')).toHaveCount(1);
    await expect(page.locator('canvas')).toHaveCount(1);

    const background = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    expect(background).toBe('rgb(15, 23, 38)');

    expect(errors).toEqual([]);
  });

  test('keeps the owner heading accessible but visually hidden', async ({ page }) => {
    await page.goto('/');
    const heading = page
      .getByRole('main')
      .getByRole('heading', { level: 1, name: 'Sajeeb Ahamed' });
    await expect(heading).toHaveCount(1);
    const box = await heading.boundingBox();
    expect(box?.width ?? 0).toBeLessThanOrEqual(1);
  });

  test('has no horizontal scroll on a phone-width viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/', { waitUntil: 'networkidle' });

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });
});
