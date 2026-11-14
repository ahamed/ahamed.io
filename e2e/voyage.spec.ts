import { expect, test, type Page } from '@playwright/test';

const dialog = (page: Page, stop: string) => page.locator(`[data-stop="${stop}"]`);
const OPEN_TIMEOUT = { timeout: 15_000 };

const ROUTE = [
  'earth',
  'moon',
  'mars',
  'phobos',
  'deimos',
  'ceres',
  'vesta',
  'pallas',
  'hygiea',
  'jupiter',
  'io',
  'europa',
  'ganymede',
  'callisto',
  'saturn',
  'titan',
  'rhea',
  'iapetus',
  'enceladus',
  'support-comet',
  'recruiter-comet',
  'upcoming-comet',
  'pluto',
  'charon',
  'arrokoth',
  'eris',
  'heliopause',
];
/** Stops whose small body sits near the screen centre, where the dialog used to cover Voyager. */
const SMALL_BODIES = [
  'vesta',
  'pallas',
  'hygiea',
  'io',
  'europa',
  'ganymede',
  'callisto',
  'titan',
  'rhea',
  'iapetus',
  'enceladus',
  'support-comet',
  'recruiter-comet',
  'upcoming-comet',
  'pluto',
  'charon',
  'arrokoth',
  'eris',
  'heliopause',
];

/** Asserts the open dialog of `stop` does not cover Voyager's on-screen box. */
async function expectClearOfVoyager(page: Page, stop: string) {
  const element = dialog(page, stop);
  // The dialog glides to a new spot, so poll until its box and Voyager's are apart.
  await expect
    .poll(async () => {
      const box = await element.boundingBox();
      const rect = (await element.getAttribute('data-voyager-rect')) ?? '';
      const [x = 0, y = 0, w = 0, h = 0] = rect.split(',').map(Number);
      if (!box || w === 0) return 'no rect';
      const apart =
        box.x + box.width <= x || x + w <= box.x || box.y + box.height <= y || y + h <= box.y;
      return apart ? 'clear' : `overlap ${JSON.stringify(box)} vs ${rect}`;
    }, OPEN_TIMEOUT)
    .toBe('clear');
}

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
    await expect(earth.getByRole('link', { name: 'LinkedIn' })).toBeVisible();
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
    // 13 steps (each 4% of the mean gap) reach p ≈ 0.052: past where Earth closes (≈ 0.049) and
    // short of the Moon's snap reach (≈ 0.054). Send them as one quick burst, as held or fast
    // keys arrive. One by one, a slow software-rendered frame between presses lets the idle snap
    // pull the target back to Earth.
    await page.evaluate(() => {
      for (let i = 0; i < 13; i++) {
        document.body.dispatchEvent(
          new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }),
        );
      }
    });
    await expect(dialog(page, 'earth')).toHaveAttribute('data-state', 'closed', OPEN_TIMEOUT);
    await expect(dialog(page, 'moon')).toHaveAttribute('data-state', 'closed');
  });

  test('wheel moves the voyage while the page itself never scrolls', async ({ page }) => {
    await page.mouse.move(400, 300);
    for (let i = 0; i < 6; i++) await page.mouse.wheel(0, 200);
    await expect(dialog(page, 'earth')).toHaveAttribute('data-state', 'closed', OPEN_TIMEOUT);
    expect(await page.evaluate(() => window.scrollY)).toBe(0);
  });

  test('PageDown visits all 27 stops in order, one dialog at a time', async ({ page }) => {
    // Twenty-six flights under headless software WebGL take far longer than the default budget.
    test.setTimeout(360_000);
    for (const [i, stop] of ROUTE.entries()) {
      if (i > 0) await page.keyboard.press('PageDown');
      await expect(dialog(page, stop)).toHaveAttribute('data-state', 'open', OPEN_TIMEOUT);
      await expect(page.locator('[data-stop][data-state="open"]')).toHaveCount(1);
    }
  });

  test('at the small-body stops the dialog leaves Voyager uncovered', async ({ page }) => {
    test.setTimeout(360_000);
    for (const stop of ROUTE.slice(1)) {
      await page.keyboard.press('PageDown');
      await expect(dialog(page, stop)).toHaveAttribute('data-state', 'open', OPEN_TIMEOUT);
      if (SMALL_BODIES.includes(stop)) await expectClearOfVoyager(page, stop);
    }
  });

  test('project cards show their tech chips', async ({ page }) => {
    for (let i = 0; i < 3; i++) await page.keyboard.press('PageDown');
    const phobos = dialog(page, 'phobos');
    await expect(phobos).toHaveAttribute('data-state', 'open', OPEN_TIMEOUT);
    const chips = phobos.getByRole('list', { name: 'Tech' }).getByRole('listitem');
    await expect(chips).toHaveText(['PHP', 'WordPress', 'REST API', 'Stripe', 'PHPUnit']);
  });

  test('the deep sky is hidden at Eris and revealed at the heliopause', async ({ page }) => {
    test.setTimeout(360_000);
    const canvas = page.locator('canvas');
    for (const stop of ROUTE.slice(1)) {
      await page.keyboard.press('PageDown');
      await expect(dialog(page, stop)).toHaveAttribute('data-state', 'open', OPEN_TIMEOUT);
      if (stop === 'eris') await expect(canvas).toHaveAttribute('data-deep-sky', 'hidden');
    }
    await expect(canvas).toHaveAttribute('data-deep-sky', 'shown', OPEN_TIMEOUT);
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

  test('End turns back to the Pale Blue Dot and shows the contact card', async ({ page }) => {
    await page.keyboard.press('End');
    const card = page.getByRole('region', { name: 'Open a channel' });
    await expect(card).toBeVisible(OPEN_TIMEOUT);
    await expect(
      page.getByText('Every line of code I’ve shipped was written on that dot.'),
    ).toBeVisible();
    await expect(card.getByRole('link', { name: 'Email' })).toHaveAttribute('href', /^mailto:/);
    await expect(card.getByRole('link', { name: 'GitHub' })).toHaveAttribute(
      'href',
      'https://github.com/ahamed',
    );
    await expect(card.getByRole('link', { name: 'LinkedIn' })).toHaveAttribute(
      'href',
      'https://www.linkedin.com/in/sisylana/',
    );
    // Fully faded in, and the bracketed dot sits clear of the caption and card.
    await expect
      .poll(
        async () => Number(await card.evaluate((e) => getComputedStyle(e).opacity)),
        OPEN_TIMEOUT,
      )
      .toBeGreaterThan(0.95);
    const layer = page.locator('[data-finale]');
    await expect(layer).toHaveAttribute('data-dot', 'shown');
    const bracket = await layer.locator('[data-bracket]').boundingBox();
    const content = await card.boundingBox();
    if (!bracket || !content) throw new Error('missing boxes');
    expect(bracket.y + bracket.height).toBeLessThanOrEqual(content.y);
  });

  test('the contact card stays hidden at the heliopause stop', async ({ page }) => {
    await page.keyboard.press('End');
    await expect(page.getByRole('region', { name: 'Open a channel' })).toBeVisible(OPEN_TIMEOUT);
    await page.keyboard.press('PageUp');
    await expect(dialog(page, 'heliopause')).toHaveAttribute('data-state', 'open', OPEN_TIMEOUT);
    await expect(page.getByRole('region', { name: 'Open a channel' })).toHaveCount(0);
    await expect(page.locator('[data-finale]')).toHaveAttribute('data-dot', 'hidden');
  });

  test('Back to Earth rewinds the voyage to the Earth dialog', async ({ page }) => {
    await page.keyboard.press('End');
    const card = page.getByRole('region', { name: 'Open a channel' });
    await expect(card).toBeVisible(OPEN_TIMEOUT);
    await card.getByRole('button', { name: 'Back to Earth' }).click();
    await expect(dialog(page, 'earth')).toHaveAttribute('data-state', 'open', OPEN_TIMEOUT);
    await expect(card).toHaveCount(0);
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

  test('fits the contact card inside the screen at the end', async ({ page }) => {
    await page.goto('/');
    await expect(dialog(page, 'earth')).toHaveAttribute('data-state', 'open', OPEN_TIMEOUT);
    await page.keyboard.press('End');
    const card = page.getByRole('region', { name: 'Open a channel' });
    await expect(card).toBeVisible(OPEN_TIMEOUT);
    await expect
      .poll(
        async () => Number(await card.evaluate((e) => getComputedStyle(e).opacity)),
        OPEN_TIMEOUT,
      )
      .toBeGreaterThan(0.95);
    const box = await card.boundingBox();
    expect(box?.x).toBeGreaterThanOrEqual(0);
    expect((box?.x ?? 0) + (box?.width ?? 0)).toBeLessThanOrEqual(375);
    expect((box?.y ?? 0) + (box?.height ?? 0)).toBeLessThanOrEqual(812);
  });
});

test.describe('voyage assets', () => {
  test('only the body and sky textures load, even at the end: no environment maps, no errors', async ({
    page,
  }) => {
    const requests: string[] = [];
    const errors: string[] = [];
    page.on('request', (request) => requests.push(new URL(request.url()).pathname));
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text());
    });
    page.on('pageerror', (error) => errors.push(error.message));

    // The Basis transcoder is fetched once the first KTX2 file arrives, so wait for it explicitly.
    const transcoder = page.waitForResponse((response) =>
      response.url().endsWith('/basis/basis_transcoder.wasm'),
    );
    await page.goto('/');
    await expect(dialog(page, 'earth')).toHaveAttribute('data-state', 'open', OPEN_TIMEOUT);
    await transcoder;
    await page.waitForLoadState('networkidle');
    // Flying to the end (heliopause, deep sky, meteors) fetches nothing more.
    await page.keyboard.press('End');
    await expect(page.locator('canvas')).toHaveAttribute('data-deep-sky', 'shown', OPEN_TIMEOUT);
    await page.waitForLoadState('networkidle');

    expect(requests.filter((path) => /\.(hdr|exr)$/i.test(path))).toEqual([]);
    const images = requests.filter((path) => /\.(jpe?g|png|webp|avif|ktx2)$/i.test(path));
    expect(images.sort()).toEqual([
      '/textures/1k_callisto.ktx2',
      '/textures/1k_charon.ktx2',
      '/textures/1k_enceladus.ktx2',
      '/textures/1k_europa.ktx2',
      '/textures/1k_ganymede.ktx2',
      '/textures/1k_iapetus.ktx2',
      '/textures/1k_io.ktx2',
      '/textures/1k_pluto.ktx2',
      '/textures/1k_rhea.ktx2',
      '/textures/1k_titan.ktx2',
      '/textures/2k_earth_clouds.ktx2',
      '/textures/2k_earth_daymap.ktx2',
      '/textures/2k_jupiter.ktx2',
      '/textures/2k_mars.ktx2',
      '/textures/2k_moon.ktx2',
      '/textures/2k_saturn.ktx2',
      '/textures/2k_saturn_ring_alpha.ktx2',
      '/textures/2k_stars_milky_way.ktx2',
    ]);
    expect(requests).toEqual(
      expect.arrayContaining(['/basis/basis_transcoder.js', '/basis/basis_transcoder.wasm']),
    );
    expect(errors).toEqual([]);
  });
});

test.describe('reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });

  test('the voyage still loads and opens Earth, with no errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text());
    });
    page.on('pageerror', (error) => errors.push(error.message));

    await page.goto('/');
    await expect(dialog(page, 'earth')).toHaveAttribute('data-state', 'open', OPEN_TIMEOUT);
    await page.keyboard.press('PageDown');
    await expect(dialog(page, 'moon')).toHaveAttribute('data-state', 'open', OPEN_TIMEOUT);
    expect(errors).toEqual([]);
  });
});
