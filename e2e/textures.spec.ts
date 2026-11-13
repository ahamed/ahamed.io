import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test } from '@playwright/test';

const TEXTURES = join(import.meta.dirname, '..', 'dist', 'textures');

test.describe('shipped textures', () => {
  test('the Milky Way sky texture is shipped and credited with its source and licence', () => {
    expect(existsSync(join(TEXTURES, '2k_stars_milky_way.jpg'))).toBe(true);
    const credits = readFileSync(join(TEXTURES, 'CREDITS.md'), 'utf8');
    const row = credits.split('\n').find((line) => line.includes('2k_stars_milky_way.jpg'));
    expect(row).toMatch(/Milky Way/);
    expect(credits).toMatch(/Solar System Scope/);
    expect(credits).toMatch(/CC BY 4\.0/);
  });
});
