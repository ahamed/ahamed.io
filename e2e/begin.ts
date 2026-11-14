import type { Page } from '@playwright/test';

/** Waits for the boot panel to finish loading and clicks "Begin mission". */
export async function begin(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Begin mission' }).click({ timeout: 30_000 });
}
