import { expect, test } from '@playwright/test';

test('shows a fallback message when WebGL is unavailable', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => {
    errors.push(error.message);
  });
  await page.goto('/', { waitUntil: 'networkidle' });
  await expect(page.getByRole('status')).toHaveText(/3D view not supported/);
  await expect(page.locator('canvas')).toHaveCount(0);
  expect(errors).toEqual([]);
});
