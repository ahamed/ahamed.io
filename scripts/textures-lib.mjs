// Pure helpers for the KTX2 texture pipeline (scripts/textures.mjs): the manifest, encoder
// arguments and the up-to-date check. No file system or process access here.
import { createHash } from 'node:crypto';

/**
 * @typedef {object} TextureEntry
 * @property {string} name      Base file name, shared by `assets/textures/<name>.jpg` and
 *                              `public/textures/<name>.ktx2`.
 * @property {'srgb' | 'linear'} transfer  Colour maps are sRGB; masks and data are linear.
 * @property {'etc1s' | 'uastc'} [encode] Basis codec; ETC1S unless the result shows blocks.
 * @property {'jpg' | 'png'} [ext] Source file extension; `jpg` unless the source has alpha.
 * @property {string} [resize] Output size `WxH`, when the source should be resampled.
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
  { name: '2k_jupiter', transfer: 'srgb' },
  { name: '2k_saturn', transfer: 'srgb' },
  // Colour by radius in RGB, opacity in A. Only its length matters, so it is squeezed to a strip.
  { name: '2k_saturn_ring_alpha', transfer: 'srgb', ext: 'png', resize: '2048x16' },
  // USGS Astrogeology global mosaics, downsampled to 1024×512 (see CREDITS.md).
  { name: '1k_io', transfer: 'srgb' },
  { name: '1k_europa', transfer: 'srgb' },
  { name: '1k_ganymede', transfer: 'srgb' },
  { name: '1k_callisto', transfer: 'srgb' },
  { name: '1k_titan', transfer: 'srgb' },
  { name: '1k_rhea', transfer: 'srgb' },
  { name: '1k_iapetus', transfer: 'srgb' },
  { name: '1k_enceladus', transfer: 'srgb' },
  { name: '1k_pluto', transfer: 'srgb' },
  { name: '1k_charon', transfer: 'srgb' },
];

/**
 * Source file name in assets/textures/.
 * @param {TextureEntry} entry
 */
export const sourceFile = (entry) => `${entry.name}.${entry.ext ?? 'jpg'}`;

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
  const resize = entry.resize ? ['--resize', entry.resize] : [];
  return [
    '--t2',
    ...codec,
    ...resize,
    // three.js never flips compressed textures and samples row 0 at v = 0 (the south pole of a
    // sphere), so store the image bottom row first.
    '--lower_left_maps_to_s0t0',
    '--genmipmap',
    '--assign_oetf',
    entry.transfer,
    output,
    source,
  ];
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
