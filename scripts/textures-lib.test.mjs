// @vitest-environment node
import { describe, expect, it } from 'vitest';
import {
  optionsKey,
  sha256,
  sourceFile,
  staleTextures,
  TEXTURES,
  toktxArgs,
} from './textures-lib.mjs';

/** @param {import('./textures-lib.mjs').TextureEntry} entry */
const fresh = (entry) => ({ source: `hash-${entry.name}`, options: optionsKey(entry) });

/** @param {(entry: import('./textures-lib.mjs').TextureEntry) => { source: string, options: string }} make */
const lockOf = (make) => Object.fromEntries(TEXTURES.map((e) => [e.name, make(e)]));
const hashes = Object.fromEntries(TEXTURES.map((e) => [e.name, `hash-${e.name}`]));
const allOutputs = () => true;

describe('TEXTURES manifest', () => {
  it('lists every shipped body and sky texture once', () => {
    expect(TEXTURES.map((e) => e.name).sort()).toEqual([
      '1k_callisto',
      '1k_charon',
      '1k_earth_clouds',
      '1k_earth_daymap',
      '1k_enceladus',
      '1k_europa',
      '1k_ganymede',
      '1k_iapetus',
      '1k_io',
      '1k_jupiter',
      '1k_mars',
      '1k_moon',
      '1k_pluto',
      '1k_rhea',
      '1k_saturn',
      '1k_saturn_ring_alpha',
      '1k_stars_milky_way',
      '1k_titan',
      '2k_earth_clouds',
      '2k_earth_daymap',
      '2k_jupiter',
      '2k_mars',
      '2k_moon',
      '2k_saturn',
      '2k_saturn_ring_alpha',
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

  it('reads JPG sources by default and the ring strip as PNG', () => {
    const byName = (/** @type {string} */ name) => {
      const found = TEXTURES.find((e) => e.name === name);
      if (!found) throw new Error(name);
      return found;
    };
    expect(sourceFile(byName('2k_jupiter'))).toBe('2k_jupiter.jpg');
    expect(sourceFile(byName('1k_io'))).toBe('1k_io.jpg');
    expect(sourceFile(byName('2k_saturn_ring_alpha'))).toBe('2k_saturn_ring_alpha.png');
  });

  it('builds a 1K version of every 2K map from the same source, at half size', () => {
    for (const big of TEXTURES.filter((e) => e.name.startsWith('2k_'))) {
      const small = TEXTURES.find((e) => e.name === big.name.replace('2k_', '1k_'));
      if (!small) throw new Error(`no 1K version of ${big.name}`);
      expect(sourceFile(small)).toBe(sourceFile(big));
      expect(small.transfer).toBe(big.transfer);
      const [w, h] = (big.resize ?? '2048x1024').split('x').map(Number);
      expect(small.resize).toBe(
        `${String((w ?? 0) / 2)}x${String(big.resize ? (h ?? 0) : (h ?? 0) / 2)}`,
      );
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

  it('keeps the ring strip’s alpha and squeezes it to a short strip', () => {
    const args = toktxArgs(entry('2k_saturn_ring_alpha'), 'in.png', 'out.ktx2');
    expect(args).not.toContain('--target_type');
    expect(args.slice(args.indexOf('--resize'), args.indexOf('--resize') + 2)).toEqual([
      '--resize',
      '2048x16',
    ]);
  });

  it('stores every texture bottom row first, the way three.js samples it (KTX2 is never flipped)', () => {
    for (const e of TEXTURES) {
      expect(toktxArgs(e, 'in', 'out.ktx2'), e.name).toContain('--lower_left_maps_to_s0t0');
    }
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
