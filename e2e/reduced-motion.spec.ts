import { expect, test, type Page } from '@playwright/test';

/** The voyage with prefers-reduced-motion: reduce. Every moving part must be still or instant. */
test.use({ reducedMotion: 'reduce' });

const dialog = (page: Page, stop: string) => page.locator(`[data-stop="${stop}"]`);
const OPEN = { timeout: 15_000 };

async function start(page: Page) {
  await page.goto('/');
  const boot = page.getByRole('dialog', { name: 'Mission boot' });
  await boot.getByRole('button', { name: 'Begin mission' }).click({ timeout: 30_000 });
  return boot;
}

test.describe('reduced motion', () => {
  test('the boot log prints at once and Read as text is prominent', async ({ page }) => {
    await page.goto('/');
    const boot = page.getByRole('dialog', { name: 'Mission boot' });
    await expect(boot.getByRole('link', { name: 'Read as text' })).toHaveAttribute(
      'data-prominent',
      '',
    );
    await expect(boot.getByRole('button', { name: 'Begin mission' })).toBeVisible({
      timeout: 30_000,
    });
    // No typing: the last line is already there when Begin appears.
    await expect(page.getByRole('log')).toContainText('telemetry link … ok', { timeout: 100 });
  });

  test('Begin cuts straight to Earth with its card complete', async ({ page }) => {
    await start(page);
    const earth = dialog(page, 'earth');
    await expect(earth).toHaveAttribute('data-state', 'open', { timeout: 2000 });
    const full = await earth.locator('.visually-hidden').first().textContent();
    await expect(earth.locator('[data-typewriter]')).toHaveText(full ?? '', { timeout: 100 });
  });

  test('map jumps and Back to Earth arrive at once', async ({ page }) => {
    await start(page);
    await expect(dialog(page, 'earth')).toHaveAttribute('data-state', 'open', OPEN);
    const map = page.getByRole('navigation', { name: 'Voyage map' });
    await map.getByRole('button', { name: 'Open-source libraries' }).click();
    await expect(dialog(page, 'saturn')).toHaveAttribute('data-state', 'open', { timeout: 1500 });
    await page.keyboard.press('End');
    const card = page.locator('[data-finale]').getByRole('region', { name: 'Open a channel' });
    await expect(card).toBeVisible(OPEN);
    await card.getByRole('button', { name: 'Back to Earth' }).click();
    await expect(dialog(page, 'earth')).toHaveAttribute('data-state', 'open', { timeout: 1500 });
  });

  test('the signal delay holds still and the hint does not animate', async ({ page }) => {
    await start(page);
    await page
      .getByRole('navigation', { name: 'Voyage map' })
      .getByRole('button', { name: 'Open-source libraries' })
      .click();
    await expect(dialog(page, 'saturn')).toHaveAttribute('data-state', 'open', OPEN);
    const delay = page.getByRole('region', { name: 'Mission telemetry' }).locator('dd').nth(3);
    const before = await delay.textContent();
    await page.waitForTimeout(2500);
    expect(await delay.textContent()).toBe(before);
    const hint = page.locator('[data-hint]');
    if ((await hint.count()) > 0) {
      expect(await hint.evaluate((e) => getComputedStyle(e).transitionDuration)).toBe('0s');
    }
  });
});
