import { expect, test, type Page } from '@playwright/test';
import { begin } from './begin.js';

const dialog = (page: Page, stop: string) => page.locator(`[data-stop="${stop}"]`);
const OPEN = { timeout: 15_000 };
const map = (page: Page) => page.getByRole('navigation', { name: 'Voyage map' });
const dot = (page: Page, name: string | RegExp) => map(page).getByRole('button', { name });

async function start(page: Page) {
  await page.goto('/');
  await begin(page);
  await expect(dialog(page, 'earth')).toHaveAttribute('data-state', 'open', OPEN);
}

/** The body's screen disc ("x,y,r") the camera rig publishes on the open dialog. */
async function bodyDisc(page: Page, stop: string) {
  const raw = (await dialog(page, stop).getAttribute('data-body-rect')) ?? '';
  const [x = NaN, y = NaN, r = NaN] = raw.split(',').map(Number);
  return { x, y, r };
}

test.describe('orbit capture', () => {
  test('the voyage starts in Earth orbit, and the lap ends with Earth read', async ({ page }) => {
    test.setTimeout(90_000);
    await start(page);
    const earth = dialog(page, 'earth');
    await expect(earth).toHaveAttribute('data-orbit', 'lap');
    await expect(earth).toHaveAttribute('data-read', 'false');
    // The Earth card types for about 6 s, then 2.5 s of rest.
    await expect(earth).toHaveAttribute('data-read', 'true', { timeout: 45_000 });
    await expect(earth).toHaveAttribute('data-orbit', 'coast');
  });

  test('scrolling backward during a lap leaves the orbit, unread', async ({ page }) => {
    await start(page);
    await page.keyboard.press('PageDown');
    const moon = dialog(page, 'moon');
    await expect(moon).toHaveAttribute('data-orbit', 'lap', OPEN);
    await page.mouse.move(700, 400);
    for (let i = 0; i < 4; i++) await page.mouse.wheel(0, -150);
    await expect(moon).not.toHaveAttribute('data-orbit', 'lap', OPEN);
    await expect(moon).toHaveAttribute('data-read', 'false');
  });

  test('centres the body beside the dialog docked on the left', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await start(page);
    await page.keyboard.press('PageDown');
    const moon = dialog(page, 'moon');
    await expect(moon).toHaveAttribute('data-orbit', 'lap', OPEN);
    // One poll takes every measurement, once the camera has eased into the orbit view.
    await expect
      .poll(async () => {
        const box = await moon.boundingBox();
        if (!box) return 'no dialog';
        const { x, r } = await bodyDisc(page, 'moon');
        const dock = box.x + box.width + 16;
        const centred = Math.abs(x - (dock + (1440 - dock) / 2)) < 1440 * 0.05;
        const docked = box.x < 24 && Math.abs(box.y + box.height / 2 - 450) < 30;
        const clear = x - r > box.x + box.width;
        return docked && centred && clear ? 'ok' : JSON.stringify({ box, x, r });
      }, OPEN)
      .toBe('ok');
  });

  test('the card first appears at the dock, with the body already centred beside it', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await start(page);
    // Record the Moon dialog on the first animation frame it is open.
    await page.evaluate(() => {
      const w = window as unknown as { firstOpen?: { x: number; body: string } };
      const tick = () => {
        const el = document.querySelector<HTMLElement>('[data-stop="moon"]');
        if (el?.dataset.state === 'open' && !w.firstOpen) {
          w.firstOpen = { x: el.getBoundingClientRect().x, body: el.dataset.bodyRect ?? '' };
        }
        if (!w.firstOpen) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
    await page.keyboard.press('PageDown');
    await expect(dialog(page, 'moon')).toHaveAttribute('data-orbit', 'lap', OPEN);
    const first = await page.evaluate(
      () => (window as unknown as { firstOpen?: { x: number; body: string } }).firstOpen,
    );
    expect(first?.x).toBeLessThan(24);
    const box = await dialog(page, 'moon').boundingBox();
    const [x = NaN] = (first?.body ?? '').split(',').map(Number);
    const dock = (box?.x ?? 0) + (box?.width ?? 0) + 16;
    expect(Math.abs(x - (dock + (1440 - dock) / 2))).toBeLessThan(1440 * 0.02);
  });

  test('the heliopause holds without a lap', async ({ page }) => {
    await start(page);
    await dot(page, 'Leadership').click();
    await expect(dialog(page, 'heliopause')).toHaveAttribute('data-orbit', 'drift', {
      timeout: 30_000,
    });
  });
});

test.describe('orbit capture on a phone', () => {
  test.use({ viewport: { width: 375, height: 812 }, hasTouch: true });

  test('frames the body above the bottom sheet', async ({ page }) => {
    await start(page);
    await dot(page, 'Ollyo').click();
    const mars = dialog(page, 'mars');
    await expect(mars).toHaveAttribute('data-orbit', 'lap', OPEN);
    await expect
      .poll(async () => {
        const sheet = await mars.boundingBox();
        const { y, r } = await bodyDisc(page, 'mars');
        return sheet ? sheet.y - (y + r) : -1;
      }, OPEN)
      .toBeGreaterThan(0);
  });
});
