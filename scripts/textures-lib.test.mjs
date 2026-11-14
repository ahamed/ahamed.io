// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { optionsKey, sha256, staleTextures, TEXTURES, toktxArgs } from './textures-lib.mjs';

/** @param {import('./textures-lib.mjs').TextureEntry} entry */
const fresh = (entry) => ({ source: `hash-${entry.name}`, options: optionsKey(entry) });

/** @param {(entry: import('./textures-lib.mjs').TextureEntry) => { source: string, options: string }} make */
const lockOf = (make) => Object.fromEntries(TEXTURES.map((e) => [e.name, make(e)]));
const hashes = Object.fromEntries(TEXTURES.map((e) => [e.name, `hash-${e.name}`]));
const allOutputs = () => true;

describe('TEXTURES manifest', () => {
  it('lists every shipped body and sky texture once', () => {
    expect(TEXTURES.map((e) => e.name).sort()).toEqual([
      '2k_earth_clouds',
      '2k_earth_daymap',
      '2k_mars',
      '2k_moon',
      '2k_stars_milky_way',
    ]);
  });

  it('treats colour maps as sRGB and the cloud mask as linear', () => {
    const transfer = Object.fromEntries(TEXTURES.map((e) => [e.name, e.transfer]));
    expect(transfer['2k_earth_clouds']).toBe('linear');
    for (const name of ['2k_earth_daymap', '2k_mars', '2k_moon', '2k_stars_milky_way']) {
      expect(transfer[name]).toBe('srgb');
    }
  });
});

describe('staleTextures', () => {
  it('reports nothing to do when every output matches its source and options', () => {
    expect(staleTextures(TEXTURES, lockOf(fresh), hashes, allOutputs)).toEqual([]);
  });

  it('rebuilds a texture whose source changed', () => {
    const changed = { ...hashes, '2k_moon': 'new-hash' };
    expect(staleTextures(TEXTURES, lockOf(fresh), changed, allOutputs).map((e) => e.name)).toEqual([
      '2k_moon',
    ]);
  });

  it('rebuilds a texture whose encoder options changed', () => {
    const lock = lockOf(fresh);
    lock['2k_mars'] = { source: 'hash-2k_mars', options: 'old options' };
    expect(staleTextures(TEXTURES, lock, hashes, allOutputs).map((e) => e.name)).toEqual([
      '2k_mars',
    ]);
  });

  it('rebuilds a texture missing from the lock or from disk', () => {
    const lock = lockOf(fresh);
    delete lock['2k_earth_daymap'];
    const noClouds = (/** @type {string} */ name) => name !== '2k_earth_clouds';
    expect(
      staleTextures(TEXTURES, lock, hashes, noClouds)
        .map((e) => e.name)
        .sort(),
    ).toEqual(['2k_earth_clouds', '2k_earth_daymap']);
  });
});

describe('toktxArgs', () => {
  const entry = (/** @type {string} */ name) => {
    const found = TEXTURES.find((e) => e.name === name);
    if (!found) throw new Error(name);
    return found;
  };

  it('encodes KTX2 with mipmaps and the right transfer function', () => {
    const args = toktxArgs(entry('2k_mars'), 'in.jpg', 'out.ktx2');
    expect(args).toEqual(expect.arrayContaining(['--t2', '--genmipmap']));
    expect(args.slice(args.indexOf('--assign_oetf'), args.indexOf('--assign_oetf') + 2)).toEqual([
      '--assign_oetf',
      'srgb',
    ]);
    expect(args.slice(-2)).toEqual(['out.ktx2', 'in.jpg']);
  });

  it('keeps the cloud mask linear', () => {
    const args = toktxArgs(entry('2k_earth_clouds'), 'in.jpg', 'out.ktx2');
    expect(args[args.indexOf('--assign_oetf') + 1]).toBe('linear');
  });
});

describe('sha256', () => {
  it('hashes bytes deterministically', () => {
    const bytes = new TextEncoder().encode('voyager');
    expect(sha256(bytes)).toBe(sha256(bytes));
    expect(sha256(bytes)).toMatch(/^[0-9a-f]{64}$/);
  });
});
