import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test } from '@playwright/test';

const ROOT = join(import.meta.dirname, '..');
const DIST = join(ROOT, 'dist');
const TEXTURES = join(DIST, 'textures');
const SOLAR_SYSTEM_SCOPE = [
  '2k_earth_daymap',
  '2k_earth_clouds',
  '2k_moon',
  '2k_mars',
  '2k_stars_milky_way',
  '2k_jupiter',
  '2k_saturn',
  '2k_saturn_ring_alpha',
];
const USGS = [
  'io',
  'europa',
  'ganymede',
  'callisto',
  'titan',
  'rhea',
  'iapetus',
  'enceladus',
  'pluto',
  'charon',
].map((moon) => `1k_${moon}`);
const KTX2 = [...SOLAR_SYSTEM_SCOPE, ...USGS];

test.describe('shipped textures', () => {
  test('every planet and sky texture ships as KTX2, and no source JPG ships', () => {
    for (const name of KTX2) expect(existsSync(join(TEXTURES, `${name}.ktx2`)), name).toBe(true);
    expect(readdirSync(TEXTURES).filter((file) => /\.(jpe?g|png)$/i.test(file))).toEqual([]);
  });

  test('every texture is stored bottom row first (KTXorientation "ru"), so maps are not upside down', () => {
    for (const name of KTX2) {
      const bytes = readFileSync(join(TEXTURES, `${name}.ktx2`));
      expect(bytes.includes(Buffer.from('KTXorientation\0ru')), name).toBe(true);
    }
  });

  test('each texture is credited with its source and licence', () => {
    const credits = readFileSync(join(TEXTURES, 'CREDITS.md'), 'utf8');
    expect(credits).toMatch(/Solar System Scope/);
    expect(credits).toMatch(/CC BY 4\.0/);
    for (const name of KTX2) expect(credits, name).toContain(`${name}.ktx2`);
    expect(credits).toMatch(/Mars/);
    expect(credits).toMatch(/Milky Way/);
    expect(credits).toMatch(/U\.S\. Geological Survey/);
    expect(credits).toMatch(/public domain/i);
    for (const name of USGS) {
      // Each moon map names the exact USGS mosaic it was made from.
      const row = credits.split('\n').find((line) => line.includes(`${name}.ktx2`)) ?? '';
      expect(row, name).toMatch(/mosaic\w*\.tif/i);
    }
  });

  test('the Basis transcoder matches the installed three.js copy byte for byte', () => {
    const three = join(ROOT, 'node_modules', 'three', 'examples', 'jsm', 'libs', 'basis');
    for (const file of ['basis_transcoder.js', 'basis_transcoder.wasm']) {
      expect(
        readFileSync(join(DIST, 'basis', file)).equals(readFileSync(join(three, file))),
        file,
      ).toBe(true);
    }
  });
});
