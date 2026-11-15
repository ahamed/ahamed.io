import { expect, test, type Page } from '@playwright/test';
import { BUDGETS } from '../src/perf/budget.js';
import { begin } from './begin.js';

const OPEN = { timeout: 30_000 };
const MB = 1024 * 1024;

declare global {
  interface Window {
    /** Set by the app with ?perf (see src/perf/snapshot.ts). */
    __voyagePerf?: {
      calls: number;
      geometries: number;
      textures: number;
      sceneGeometries: number;
      peak: { calls: number; triangles: number; textureBytes: number };
      resetPeaks: () => void;
    };
  }
}

interface Reading {
  calls: number;
  triangles: number;
  textureBytes: number;
  geometries: number;
  textures: number;
  sceneGeometries: number;
}

/** Geometries post-processing draws outside the scene graph (its full-screen triangle). */
const POST_GEOMETRIES = 2;

/** The sample stops: map-dot label and dialog id, or the finale (reached with End). */
const STOPS = [
  { id: 'earth', dot: 'Hello, I’m Sajeeb' },
  { id: 'ceres', dot: 'Growfund' },
  { id: 'jupiter', dot: 'Products & platforms' },
  { id: 'saturn', dot: 'Open-source libraries' },
  { id: 'pluto', dot: 'Tech stack' },
  { id: 'heliopause', dot: 'Leadership' },
  { id: 'finale', dot: null },
] as const;

const dialog = (page: Page, stop: string) => page.locator(`[data-stop="${stop}"]`);
const dot = (page: Page, name: string) =>
  page.getByRole('navigation', { name: 'Voyage map' }).getByRole('button', { name });
const card = (page: Page) =>
  page.locator('[data-finale]').getByRole('region', { name: 'Open a channel' });

async function arrive(page: Page, stop: (typeof STOPS)[number]): Promise<void> {
  if (stop.dot === null) {
    await page.keyboard.press('End');
    await expect(card(page)).toBeVisible(OPEN);
    return;
  }
  // Dispatched, not clicked: on a phone-width map neighbouring dots overlap (hud.spec covers the clicks).
  await dot(page, stop.dot).dispatchEvent('click');
  await expect(dialog(page, stop.id)).toHaveAttribute('data-state', 'open', OPEN);
}

/** Peaks over one settled second at the current stop, plus the live object counts. */
async function settle(page: Page): Promise<Reading> {
  await page.evaluate(() => window.__voyagePerf?.resetPeaks());
  await page.waitForTimeout(1000);
  return page.evaluate(() => {
    const s = window.__voyagePerf;
    if (!s) throw new Error('no __voyagePerf');
    return {
      calls: s.peak.calls,
      triangles: s.peak.triangles,
      textureBytes: s.peak.textureBytes,
      geometries: s.geometries,
      textures: s.textures,
      sceneGeometries: s.sceneGeometries,
    };
  });
}

async function start(page: Page, query: string): Promise<void> {
  await page.goto(`/?perf${query}`);
  await begin(page);
  await expect(dialog(page, 'earth')).toHaveAttribute('data-state', 'open', OPEN);
  await expect
    .poll(() => page.evaluate(() => window.__voyagePerf?.calls ?? 0), OPEN)
    .toBeGreaterThan(0);
}

test.describe('performance budget', () => {
  // Render targets scale with the viewport, so each tier runs at a size typical of its devices.
  const VIEWPORTS = { high: { width: 1280, height: 720 }, low: { width: 390, height: 844 } };
  for (const tier of ['high', 'low'] as const) {
    test(`${tier} tier stays within its caps at every sample stop`, async ({ page }) => {
      test.setTimeout(240_000);
      await page.setViewportSize(VIEWPORTS[tier]);
      await start(page, `&quality=${tier}`);
      const budget = BUDGETS[tier];
      const table: string[] = [];
      for (const stop of STOPS) {
        await arrive(page, stop);
        const r = await settle(page);
        table.push(
          `${tier}\t${stop.id}\tcalls ${String(r.calls)}\ttris ${String(r.triangles)}\ttex ${(r.textureBytes / MB).toFixed(1)} MB\tgeoms ${String(r.geometries)}\ttextures ${String(r.textures)}`,
        );
        expect.soft(r.calls, `${stop.id} draw calls`).toBeLessThanOrEqual(budget.calls);
        expect.soft(r.triangles, `${stop.id} triangles`).toBeLessThanOrEqual(budget.triangles);
        expect
          .soft(r.textureBytes, `${stop.id} texture bytes`)
          .toBeLessThanOrEqual(budget.textureBytes);
      }
      console.log(table.join('\n'));
    });
  }
});

test.describe('GPU leaks', () => {
  test('round trips never hold more geometries than the scene has, nor add textures', async ({
    page,
  }) => {
    test.setTimeout(300_000);
    // A fixed tier: a tier change swaps post-processing buffers, which would read as a leak.
    await start(page, '&quality=high');
    const roundTrip = async () => {
      await page.keyboard.press('End');
      await expect(card(page)).toBeVisible(OPEN);
      await arrive(page, STOPS[0]);
    };
    // three.js uploads a geometry the first time it is drawn, and which ones a fast flight draws
    // depends on frame timing, so the bound is the scene itself, not an earlier reading.
    await roundTrip();
    const before = await settle(page);
    await roundTrip();
    await roundTrip();
    const after = await settle(page);

    expect(after.geometries).toBeLessThanOrEqual(after.sceneGeometries + POST_GEOMETRIES);
    expect(after.textures).toBeLessThanOrEqual(before.textures);
  });
});

test.describe('?perf overlay', () => {
  test('shows the panel with live numbers', async ({ page }) => {
    await start(page, '');
    const panel = page.getByRole('region', { name: 'Performance' });
    await expect(panel).toBeVisible();
    await expect(panel).toContainText(/FPS\s*\d+\.\d/);
    await expect(panel).toContainText(/Tier\s*(high|medium|low)/);
  });

  test('without ?perf nothing loads', async ({ page }) => {
    const scripts: string[] = [];
    page.on('request', (request) => {
      const name = new URL(request.url()).pathname.split('/').pop() ?? '';
      if (name.endsWith('.js')) scripts.push(name);
    });
    await page.goto('/');
    await begin(page);
    await expect(dialog(page, 'earth')).toHaveAttribute('data-state', 'open', OPEN);
    expect(scripts.filter((name) => /^(PerfOverlay|LiveProbe)/.test(name))).toEqual([]);
    expect(await page.evaluate(() => window.__voyagePerf)).toBeUndefined();
    await expect(page.getByRole('region', { name: 'Performance' })).toHaveCount(0);
  });
});
