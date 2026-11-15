/**
 * Captures the link-preview image, public/og.png (1200 × 630): the Pale Blue Dot finale with
 * Voyager, the dot and the caption, without the HUD or the contact card. Run once after
 * `pnpm build` and commit the PNG: `node scripts/share-image.mjs`.
 */
import { chromium } from '@playwright/test';
import { preview } from 'vite';

const OUT = new URL('../public/og.png', import.meta.url);
const PORT = 4179;

const server = await preview({ preview: { port: PORT, strictPort: true }, logLevel: 'error' });
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
  await page.goto(`http://localhost:${String(PORT)}/`);
  await page.getByRole('button', { name: 'Begin silently' }).click({ timeout: 60_000 });
  await page.keyboard.press('End');
  await page
    .locator('[data-finale]')
    .getByRole('region', { name: 'Open a channel' })
    .waitFor({ timeout: 30_000 });
  // Keep the caption; hide the HUD, the contact card and the hint for a clean frame.
  await page.addStyleTag({
    content:
      '[data-hud], [data-finale] section > div:last-child { visibility: hidden !important; }',
  });
  await page.waitForTimeout(3000);
  await page.screenshot({ path: OUT.pathname });
  console.log(`wrote ${OUT.pathname}`);
} finally {
  await browser.close();
  await new Promise((resolve) => {
    server.httpServer.close(resolve);
  });
}
