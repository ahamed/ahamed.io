import { expect, test, type Page } from '@playwright/test';
import { begin } from './begin.js';

const dialog = (page: Page, stop: string) => page.locator(`[data-stop="${stop}"]`);
const OPEN = { timeout: 15_000 };
const telemetry = (page: Page) => page.getByRole('region', { name: 'Mission telemetry' });
const map = (page: Page) => page.getByRole('navigation', { name: 'Voyage map' });
const dot = (page: Page, name: string | RegExp) => map(page).getByRole('button', { name });

async function start(page: Page) {
  await page.goto('/');
  await begin(page);
  await expect(dialog(page, 'earth')).toHaveAttribute('data-state', 'open', OPEN);
}

test.describe('HUD', () => {
  test('telemetry reads launch day at Earth and March 1979 at Jupiter', async ({ page }) => {
    await start(page);
    await expect(telemetry(page)).toContainText('05 Sep 1977');
    await expect(telemetry(page)).toContainText('1.01 AU');
    await dot(page, 'Products & platforms').click();
    await expect(dialog(page, 'jupiter')).toHaveAttribute('data-state', 'open', OPEN);
    await expect(telemetry(page)).toContainText('05 Mar 1979');
    await expect(telemetry(page)).toContainText('5.20 AU');
  });

  test('clicking a map dot flies to that stop', async ({ page }) => {
    await start(page);
    await dot(page, 'Open-source libraries').click();
    await expect(dialog(page, 'saturn')).toHaveAttribute('data-state', 'open', OPEN);
    await expect(dialog(page, 'earth')).toHaveAttribute('data-state', 'closed');
  });

  test('left and right arrows move along the dots without moving the voyage', async ({ page }) => {
    await start(page);
    await dot(page, /^Hello/).focus();
    await page.keyboard.press('ArrowRight');
    await expect(dot(page, 'Career timeline')).toBeFocused();
    await page.waitForTimeout(800);
    await expect(dialog(page, 'earth')).toHaveAttribute('data-state', 'open');
  });

  test('the controls hint shows on a first visit and fades after two moves', async ({ page }) => {
    await start(page);
    const hint = page.locator('[data-hint]');
    await expect(hint).toHaveAttribute('data-visible', '');
    await expect(hint).toContainText('Space autoplay');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    await expect(hint).not.toHaveAttribute('data-visible', '', OPEN);
  });

  test('the sound and autoplay chip sits above the map', async ({ page }) => {
    await start(page);
    const chip = await page.getByRole('group', { name: 'Voyage controls' }).boundingBox();
    const strip = await map(page).boundingBox();
    if (!chip || !strip) throw new Error('missing boxes');
    expect(chip.y + chip.height).toBeLessThanOrEqual(strip.y);
    const block = await telemetry(page).boundingBox();
    expect(block?.x).toBeLessThan(720);
    expect(block?.y).toBeLessThan(450);
    expect(strip.width).toBeGreaterThan(1200);
  });

  test('the telemetry and map dim in the finale', async ({ page }) => {
    await start(page);
    await page.keyboard.press('End');
    await expect(page.getByRole('region', { name: 'Open a channel' })).toBeVisible(OPEN);
    await expect
      .poll(
        async () => Number(await telemetry(page).evaluate((e) => getComputedStyle(e).opacity)),
        OPEN,
      )
      .toBeCloseTo(0.25, 1);
    await expect
      .poll(async () => Number(await map(page).evaluate((e) => getComputedStyle(e).opacity)), OPEN)
      .toBeCloseTo(0.25, 1);
  });
});

test.describe('HUD on a phone', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('everything sits at the top, clear of the bottom sheet, with no sideways scroll', async ({
    page,
  }) => {
    await start(page);
    const strip = await map(page).boundingBox();
    expect(strip?.y).toBeLessThan(10);
    const sheet = await dialog(page, 'earth').boundingBox();
    if (!sheet) throw new Error('no sheet');
    const parts = [
      telemetry(page),
      map(page),
      page.getByRole('group', { name: 'Voyage controls' }),
    ];
    for (const part of parts) {
      const box = await part.boundingBox();
      expect((box?.y ?? 0) + (box?.height ?? 0)).toBeLessThan(812 * 0.6);
      expect((box?.y ?? 0) + (box?.height ?? 0)).toBeLessThan(sheet.y);
    }
    const chip = await page.getByRole('group', { name: 'Voyage controls' }).boundingBox();
    const line = await telemetry(page).boundingBox();
    if (!chip || !line) throw new Error('missing boxes');
    expect(chip.y).toBeGreaterThanOrEqual(line.y + line.height - 1);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });
});
