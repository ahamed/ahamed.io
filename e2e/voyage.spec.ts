import { expect, test, type Page } from '@playwright/test';

const dialog = (page: Page, stop: string) => page.locator(`[data-stop="${stop}"]`);
const OPEN_TIMEOUT = { timeout: 15_000 };

test.describe('voyage', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await expect(dialog(page, 'earth')).toHaveAttribute('data-state', 'open', OPEN_TIMEOUT);
  });

  test('opens Earth on load in the terminal style', async ({ page }) => {
    const earth = page.getByRole('region', { name: /Hello/ });
    await expect(earth).toBeVisible();
    await expect(earth).toHaveCSS('background-color', 'rgba(30, 58, 64, 0.72)');
    await expect(earth).toHaveCSS('color', 'rgb(103, 211, 193)');
    await expect(earth.getByRole('link', { name: 'GitHub' })).toBeVisible();
    await expect(earth.getByRole('link', { name: 'LinkedIn' })).toHaveCount(0);
  });

  test('PageDown flies to the Moon and PageUp returns to Earth', async ({ page }) => {
    await page.keyboard.press('PageDown');
    await expect(dialog(page, 'moon')).toHaveAttribute('data-state', 'open', OPEN_TIMEOUT);
    await expect(dialog(page, 'earth')).toHaveAttribute('data-state', 'closed');

    await page.keyboard.press('PageUp');
    await expect(dialog(page, 'earth')).toHaveAttribute('data-state', 'open', OPEN_TIMEOUT);
    await expect(dialog(page, 'moon')).toHaveAttribute('data-state', 'closed');
  });

  test('arrow steps move forward and close Earth without skipping to the Moon', async ({
    page,
  }) => {
    for (let i = 0; i < 12; i++) await page.keyboard.press('ArrowDown');
    await expect(dialog(page, 'earth')).toHaveAttribute('data-state', 'closed', OPEN_TIMEOUT);
    await expect(dialog(page, 'moon')).toHaveAttribute('data-state', 'closed');
  });

  test('wheel moves the voyage while the page itself never scrolls', async ({ page }) => {
    await page.mouse.move(400, 300);
    for (let i = 0; i < 6; i++) await page.mouse.wheel(0, 200);
    await expect(dialog(page, 'earth')).toHaveAttribute('data-state', 'closed', OPEN_TIMEOUT);
    expect(await page.evaluate(() => window.scrollY)).toBe(0);
  });

  test('End passes everything and Home returns to Earth', async ({ page }) => {
    await page.keyboard.press('End');
    await expect(dialog(page, 'earth')).toHaveAttribute('data-state', 'closed', OPEN_TIMEOUT);
    await expect
      .poll(async () => dialog(page, 'moon').getAttribute('data-state'), OPEN_TIMEOUT)
      .toBe('closed');
    await page.keyboard.press('Home');
    await expect(dialog(page, 'earth')).toHaveAttribute('data-state', 'open', OPEN_TIMEOUT);
  });
});

test.describe('voyage on a phone', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('shows the dialog as a full-width bottom sheet', async ({ page }) => {
    await page.goto('/');
    const earth = dialog(page, 'earth');
    await expect(earth).toHaveAttribute('data-state', 'open', OPEN_TIMEOUT);
    const box = await earth.boundingBox();
    expect(box?.width).toBeCloseTo(375, 0);
    expect((box?.y ?? 0) + (box?.height ?? 0)).toBeCloseTo(812, 0);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });
});

test.describe('voyage assets', () => {
  test('Voyager needs no environment maps or extra textures, and logs no errors', async ({
    page,
  }) => {
    const requests: string[] = [];
    const errors: string[] = [];
    page.on('request', (request) => requests.push(new URL(request.url()).pathname));
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text());
    });
    page.on('pageerror', (error) => errors.push(error.message));

    await page.goto('/');
    await expect(dialog(page, 'earth')).toHaveAttribute('data-state', 'open', OPEN_TIMEOUT);

    expect(requests.filter((path) => /\.(hdr|exr)$/i.test(path))).toEqual([]);
    const images = requests.filter((path) => /\.(jpe?g|png|webp|avif|ktx2)$/i.test(path));
    expect(images.sort()).toEqual([
      '/textures/2k_earth_clouds.jpg',
      '/textures/2k_earth_daymap.jpg',
      '/textures/2k_moon.jpg',
    ]);
    expect(errors).toEqual([]);
  });
});
