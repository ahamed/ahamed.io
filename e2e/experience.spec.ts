import { expect, test, type Page } from '@playwright/test';
import { begin } from './begin.js';

const dialog = (page: Page, stop: string) => page.locator(`[data-stop="${stop}"]`);
const OPEN = { timeout: 15_000 };

test.describe('boot and intro', () => {
  test('the boot panel shows real progress, ignores voyage keys, and Begin opens Earth', async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on('console', (m) => {
      if (m.type() === 'error') errors.push(m.text());
    });
    page.on('pageerror', (e) => errors.push(e.message));

    await page.goto('/');
    const boot = page.getByRole('dialog', { name: 'Mission boot' });
    await expect(boot).toBeVisible();
    await page.keyboard.press('PageDown');
    const bar = boot.getByRole('progressbar');
    await expect(bar).toHaveAttribute('aria-valuenow', '100', { timeout: 30_000 });
    await expect(boot.getByRole('button', { name: 'Begin mission' })).toBeFocused();
    await expect(boot.getByRole('button', { name: 'Begin silently' })).toBeVisible();
    await expect(page.getByRole('log')).toContainText('telemetry link … ok', OPEN);

    await begin(page);
    await expect(boot).toHaveCount(0, OPEN);
    // The keypress before Begin did nothing: the intro lands on Earth, not the Moon.
    await expect(dialog(page, 'earth')).toHaveAttribute('data-state', 'open', OPEN);
    await expect(dialog(page, 'moon')).toHaveAttribute('data-state', 'closed');
    expect(errors).toEqual([]);
  });

  test('a key during the intro skips it and acts', async ({ page }) => {
    await page.goto('/');
    await begin(page);
    await page.keyboard.press('PageDown');
    await expect(dialog(page, 'moon')).toHaveAttribute('data-state', 'open', OPEN);
  });
});

test.describe('sound and autoplay', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await begin(page);
    await expect(dialog(page, 'earth')).toHaveAttribute('data-state', 'open', OPEN);
  });

  test('M toggles mute, and the choice survives a reload', async ({ page }) => {
    const sound = page.getByRole('button', { name: 'Mute sound' });
    await expect(sound).toHaveAttribute('aria-pressed', 'false');
    await page.keyboard.press('m');
    await expect(sound).toHaveAttribute('aria-pressed', 'true');
    await page.reload();
    await begin(page);
    await expect(page.getByRole('button', { name: 'Mute sound' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  test('Space autoplays to the Moon, and an arrow key pauses it', async ({ page }) => {
    test.setTimeout(90_000);
    const autoplay = page.getByRole('button', { name: 'Autoplay' });
    await page.keyboard.press('Space');
    await expect(autoplay).toHaveAttribute('aria-pressed', 'true');
    await expect(dialog(page, 'moon')).toHaveAttribute('data-state', 'open', { timeout: 60_000 });
    await page.keyboard.press('ArrowDown');
    await expect(autoplay).toHaveAttribute('aria-pressed', 'false');
  });
});
