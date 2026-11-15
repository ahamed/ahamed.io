import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { FORMATS, textureBytes } from './textureBytes';

const MIP = 4 / 3;

describe('textureBytes', () => {
  it('counts 4 bytes per texel for RGBA8, times 4/3 with mipmaps', () => {
    const base = { width: 256, height: 256, format: FORMATS.RGBA, type: FORMATS.UNSIGNED_BYTE };
    expect(textureBytes({ ...base, mipmaps: false })).toBe(262_144);
    expect(textureBytes({ ...base, mipmaps: true })).toBe(Math.round(262_144 * MIP));
  });

  it('counts 8 bytes per texel for half-float RGBA and 16 for float', () => {
    const base = { width: 16, height: 16, format: FORMATS.RGBA, mipmaps: false };
    expect(textureBytes({ ...base, type: FORMATS.HALF_FLOAT })).toBe(16 * 16 * 8);
    expect(textureBytes({ ...base, type: FORMATS.FLOAT })).toBe(16 * 16 * 16);
  });

  it('counts fewer channels for red and red-green formats', () => {
    const base = { width: 8, height: 8, type: FORMATS.UNSIGNED_BYTE, mipmaps: false };
    expect(textureBytes({ ...base, format: FORMATS.RED })).toBe(64);
    expect(textureBytes({ ...base, format: FORMATS.RG })).toBe(128);
  });

  it('counts 16 bytes per 4×4 block for BC7, ASTC 4×4 and ETC2 RGBA', () => {
    for (const format of [FORMATS.BC7, FORMATS.ASTC_4x4, FORMATS.ETC2_RGBA, FORMATS.BC3]) {
      expect(textureBytes({ width: 1024, height: 512, format, mipmaps: false })).toBe(524_288);
    }
  });

  it('counts 8 bytes per 4×4 block for BC1, ETC1 and ETC2 RGB', () => {
    for (const format of [FORMATS.BC1_RGB, FORMATS.BC1_RGBA, FORMATS.ETC1, FORMATS.ETC2_RGB]) {
      expect(textureBytes({ width: 1024, height: 512, format, mipmaps: false })).toBe(262_144);
    }
  });

  it('rounds compressed sizes up to whole blocks', () => {
    expect(textureBytes({ width: 5, height: 3, format: FORMATS.BC7, mipmaps: false })).toBe(
      2 * 1 * 16,
    );
  });

  it('treats an unknown format as RGBA8 (the conservative guess)', () => {
    expect(textureBytes({ width: 4, height: 4, format: 99_999, mipmaps: false })).toBe(64);
  });

  it('returns 0 for a texture without a size yet', () => {
    expect(textureBytes({ width: 0, height: 0, format: FORMATS.RGBA, mipmaps: true })).toBe(0);
  });

  it('uses the same numbers as three.js', () => {
    expect(FORMATS).toEqual({
      RGBA: THREE.RGBAFormat,
      RGB: THREE.RGBFormat,
      RED: THREE.RedFormat,
      RG: THREE.RGFormat,
      UNSIGNED_BYTE: THREE.UnsignedByteType,
      HALF_FLOAT: THREE.HalfFloatType,
      FLOAT: THREE.FloatType,
      BC1_RGB: THREE.RGB_S3TC_DXT1_Format,
      BC1_RGBA: THREE.RGBA_S3TC_DXT1_Format,
      BC3: THREE.RGBA_S3TC_DXT5_Format,
      BC7: THREE.RGBA_BPTC_Format,
      ETC1: THREE.RGB_ETC1_Format,
      ETC2_RGB: THREE.RGB_ETC2_Format,
      ETC2_RGBA: THREE.RGBA_ETC2_EAC_Format,
      ASTC_4x4: THREE.RGBA_ASTC_4x4_Format,
    });
  });
});
