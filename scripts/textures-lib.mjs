// Pure helpers for the KTX2 texture pipeline (scripts/textures.mjs): the manifest, encoder
// arguments and the up-to-date check. No file system or process access here.
import { createHash } from 'node:crypto';

/**
 * @typedef {object} TextureEntry
 * @property {string} name      Base file name, shared by `assets/textures/<name>.jpg` and
 *                              `public/textures/<name>.ktx2`.
 * @property {'srgb' | 'linear'} transfer  Colour maps are sRGB; masks and data are linear.
 * @property {'etc1s' | 'uastc'} [encode] Basis codec; ETC1S unless the result shows blocks.
 */

/**
 * @typedef {object} LockEntry
 * @property {string} source   sha256 of the source image the output was built from.
 * @property {string} options  `optionsKey` of the entry when it was built.
 */

/** @type {readonly TextureEntry[]} */
export const TEXTURES = [
  { name: '2k_earth_daymap', transfer: 'srgb' },
  { name: '2k_earth_clouds', transfer: 'linear' },
  { name: '2k_moon', transfer: 'srgb' },
  { name: '2k_stars_milky_way', transfer: 'srgb' },
  { name: '2k_mars', transfer: 'srgb' },
];

/**
 * toktx arguments for one texture: KTX2 with generated mipmaps, Basis-compressed.
 * @param {TextureEntry} entry
 * @param {string} source
 * @param {string} output
 * @returns {string[]}
 */
export function toktxArgs(entry, source, output) {
  const codec =
    entry.encode === 'uastc'
      ? ['--encode', 'uastc', '--uastc_quality', '2', '--zcmp', '18']
      : ['--encode', 'etc1s', '--clevel', '4', '--qlevel', '192'];
  return ['--t2', ...codec, '--genmipmap', '--assign_oetf', entry.transfer, output, source];
}

/**
 * Everything that affects an output besides its source bytes.
 * @param {TextureEntry} entry
 */
export const optionsKey = (entry) => toktxArgs(entry, '', '').slice(0, -2).join(' ');

/**
 * Entries whose output is missing, or was built from other source bytes or options.
 * @param {readonly TextureEntry[]} entries
 * @param {Record<string, LockEntry | undefined>} lock
 * @param {Record<string, string>} hashes   sha256 of each current source, by name.
 * @param {(name: string) => boolean} outputExists
 * @returns {TextureEntry[]}
 */
export function staleTextures(entries, lock, hashes, outputExists) {
  return entries.filter((entry) => {
    const built = lock[entry.name];
    return (
      !outputExists(entry.name) ||
      built?.source !== hashes[entry.name] ||
      built?.options !== optionsKey(entry)
    );
  });
}

/** @param {Uint8Array} bytes */
export const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');
