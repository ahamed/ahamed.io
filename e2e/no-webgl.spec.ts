import { expect, test } from '@playwright/test';

test('shows Text mode, with a note, when WebGL is unavailable', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => {
    errors.push(error.message);
  });
  await page.goto('/', { waitUntil: 'networkidle' });
  await expect(page.getByRole('note')).toHaveText(/needs WebGL/);
  await expect(page.getByRole('heading', { name: 'Career timeline' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Back to the voyage' })).toHaveCount(0);
  await expect(page.locator('canvas')).toHaveCount(0);
  expect(errors).toEqual([]);
});
