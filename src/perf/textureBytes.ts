/**
 * three.js format and type constants, copied as plain numbers so this module stays free of three
 * (a test checks they match).
 */
export const FORMATS = {
  RGBA: 1023,
  RGB: 1022,
  RED: 1028,
  RG: 1030,
  UNSIGNED_BYTE: 1009,
  HALF_FLOAT: 1016,
  FLOAT: 1015,
  BC1_RGB: 33776,
  BC1_RGBA: 33777,
  BC3: 33779,
  BC7: 36492,
  ETC1: 36196,
  ETC2_RGB: 37492,
  ETC2_RGBA: 37496,
  ASTC_4x4: 37808,
} as const;

/** Bytes per 4×4 block for the block-compressed formats. */
const BLOCK_BYTES = new Map<number, number>([
  [FORMATS.BC1_RGB, 8],
  [FORMATS.BC1_RGBA, 8],
  [FORMATS.ETC1, 8],
  [FORMATS.ETC2_RGB, 8],
  [FORMATS.BC3, 16],
  [FORMATS.BC7, 16],
  [FORMATS.ETC2_RGBA, 16],
  [FORMATS.ASTC_4x4, 16],
]);

/** Channels per texel; RGB is stored padded to RGBA on most GPUs. */
const CHANNELS = new Map<number, number>([
  [FORMATS.RED, 1],
  [FORMATS.RG, 2],
  [FORMATS.RGB, 4],
  [FORMATS.RGBA, 4],
]);

const BYTES_PER_CHANNEL = new Map<number, number>([
  [FORMATS.UNSIGNED_BYTE, 1],
  [FORMATS.HALF_FLOAT, 2],
  [FORMATS.FLOAT, 4],
]);

export interface TextureShape {
  width: number;
  height: number;
  format: number;
  /** Component type; ignored for compressed formats. Defaults to unsigned bytes. */
  type?: number;
  mipmaps: boolean;
}

/**
 * Estimated GPU bytes for one texture: width × height × bytes per texel (or per 4×4 block for
 * compressed formats), times 4/3 for a full mip chain. Unknown formats count as RGBA8.
 */
export function textureBytes({ width, height, format, type, mipmaps }: TextureShape): number {
  if (width <= 0 || height <= 0) return 0;
  const block = BLOCK_BYTES.get(format);
  const base =
    block === undefined
      ? width *
        height *
        (CHANNELS.get(format) ?? 4) *
        (BYTES_PER_CHANNEL.get(type ?? FORMATS.UNSIGNED_BYTE) ?? 1)
      : Math.ceil(width / 4) * Math.ceil(height / 4) * block;
  return mipmaps ? Math.round((base * 4) / 3) : base;
}
